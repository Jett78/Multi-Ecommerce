import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { CourierSettingsService } from './courier-settings/courier-settings.service';
import { CourierRepository } from './courier.repository';
import { CourierAdapter, DeliveryRate, CourierOrderResult } from './adapters/courier.adapter';
import { PathaoAdapter } from './adapters/pathao.adapter';

export type PathaoTargetStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface SyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'failed';
  cities: number;
  zones: number;
  areas: number;
  errors: number;
  message?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export const WEIGHT_BRACKETS = [1, 2, 3, 5, 10];

const DEFAULT_DELIVERY_CHARGE = Number(process.env.DEFAULT_DELIVERY_CHARGE ?? 0);

function bandUpper(weightKg: number): number | null {
  if (weightKg <= 0) return WEIGHT_BRACKETS[0];
  const upper = WEIGHT_BRACKETS.find((b) => b >= weightKg);
  return upper ?? null;
}

/**
 * Maps a Pathao webhook `event` or `order_status_slug` to one of our
 * `order_status` values. Mapping is rank-aware (no-regress): an order is never
 * moved backwards (e.g. delivered -> processing). `cancelled` is only allowed
 * from a non-delivered state and `delivered` is terminal.
 */
const PATHAO_EVENT_MAP: Record<string, PathaoTargetStatus> = {
  'order.created': 'processing',
  'order.updated': 'processing',
  'order.pickup-requested': 'processing',
  'order.assigned-for-pickup': 'processing',
  'order.on-hold': 'processing',
  'order.picked': 'shipped',
  'order.at-the-sorting-hub': 'shipped',
  'order.in-transit': 'shipped',
  'order.received-at-last-mile-hub': 'shipped',
  'order.assigned-for-delivery': 'shipped',
  'order.delivered': 'delivered',
  'order.delivery-failed': 'cancelled',
  'order.returned': 'cancelled',
  'order.returned-to-merchant': 'cancelled',
  'order.cancelled': 'cancelled',
};

const STATUS_RANK: Record<PathaoTargetStatus, number> = {
  pending: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  delivered: 4,
  cancelled: -1,
};

function normalizeKey(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-');
}

export function mapPathaoEventToOrderStatus(
  eventOrSlug: string | null | undefined,
  currentStatus?: string,
): PathaoTargetStatus | null {
  if (!eventOrSlug) return null;

  const key = normalizeKey(eventOrSlug);
  let target: PathaoTargetStatus | null = PATHAO_EVENT_MAP[key] || null;

  if (!target) {
    // Fall back to a loose match against known slug fragments.
    const loose = Object.keys(PATHAO_EVENT_MAP).find((k) => {
      const frag = k.replace('order.', '');
      return key === frag || key.includes(frag) || frag.includes(key);
    });
    target = loose ? PATHAO_EVENT_MAP[loose] : null;
  }

  if (!target) return null;

  const current = (currentStatus as PathaoTargetStatus) || 'pending';

  if (target === 'cancelled') {
    // Only allow cancellation from a non-delivered state.
    return current === 'delivered' ? null : 'cancelled';
  }

  // delivered is terminal; never move an order backwards.
  if (current === 'delivered') return null;
  if ((STATUS_RANK[target] ?? 0) <= (STATUS_RANK[current] ?? 0)) {
    return null;
  }

  return target;
}

/**
 * Determines whether a COD payment should be marked `completed` when Pathao
 * reports a delivered status.
 */
export function decidePaymentOnDelivered(
  order: { paymentMethod?: string | null; paymentStatus?: string },
  pathaoSlug: string | null | undefined,
): boolean {
  const slug = normalizeKey(pathaoSlug || '');
  const isDelivered = slug === 'order.delivered' || slug === 'delivered';
  if (!isDelivered) return false;
  return (
    order.paymentMethod === 'cod' &&
    order.paymentStatus !== 'completed' &&
    order.paymentStatus !== 'refunded'
  );
}

@Injectable()
export class CourierService {
  private readonly logger = new Logger(CourierService.name);
  private adapters = new Map<string, { adapter: CourierAdapter; signature: string }>();
  private syncStatuses = new Map<string, SyncStatus>();

  constructor(
    private readonly settingsService: CourierSettingsService,
    private readonly repository: CourierRepository,
  ) {}

  /**
   * Builds a signature for the current settings so a cached adapter is only
   * reused when nothing that it depends on has changed. If the stored
   * `apiBaseUrl`, `config`, or `credentials` change (e.g. via
   * `PUT /courier/settings/:provider`), the cached adapter is rebuilt on the
   * next call — no API restart required.
   */
  private static settingsSignature(apiBaseUrl: string, config: any, credentials: any): string {
    return `${apiBaseUrl}|${JSON.stringify(config)}|${JSON.stringify(credentials)}`;
  }

  async getAdapter(provider: string): Promise<CourierAdapter> {
    const settings = await this.settingsService.getCredentials(provider);
    if (!settings) {
      throw new BadRequestException(`Courier provider "${provider}" is not configured or disabled`);
    }

    const signature = CourierService.settingsSignature(
      settings.apiBaseUrl,
      settings.config,
      settings.credentials,
    );

    const cached = this.adapters.get(provider);
    if (cached && cached.signature === signature) {
      return cached.adapter;
    }

    let adapter: CourierAdapter;

    switch (provider) {
      case 'pathao':
        adapter = new PathaoAdapter(
          settings.apiBaseUrl,
          settings.credentials,
          settings.config,
        );
        break;
      default:
        throw new BadRequestException(`Unknown courier provider: ${provider}`);
    }

    this.adapters.set(provider, { adapter, signature });
    return adapter;
  }

  /**
   * Invalidates the cached adapter(s). Public so callers (e.g. settings
   * updates, sync) can force a rebuild. The cache also self-heals via the
   * settings signature in `getAdapter`.
   */
  clearAdapterCache(provider?: string) {
    if (provider) {
      this.adapters.delete(provider);
    } else {
      this.adapters.clear();
    }
  }

  async calculateRate(district: string, weightKg: number, codAmount?: number, deliveryType?: string): Promise<DeliveryRate & { providerUsed: string }> {
    const mappings = await this.repository.findMappingsByDistrict(district);
    const mappedProviders = mappings.filter((m) => m.isMapped);

    if (mappedProviders.length === 0) {
      this.logger.warn(`No courier mapping found for district "${district}"; using default ${DEFAULT_DELIVERY_CHARGE}`);
      return {
        provider: 'default',
        basePrice: DEFAULT_DELIVERY_CHARGE,
        discount: 0,
        finalPrice: DEFAULT_DELIVERY_CHARGE,
        codEnabled: false,
        codPercentage: 0,
        estimatedDays: 2,
        providerUsed: 'default',
      };
    }

    let lastError: Error | null = null;

    for (const mapping of mappedProviders) {
      const tiers = Array.isArray(mapping.deliveryChargeOverrides)
        ? mapping.deliveryChargeOverrides
        : [];

      try {
        if (tiers.length > 0) {
          const upper = bandUpper(weightKg);
          const tier = upper != null ? tiers.find((t) => t.weightKg === upper) : undefined;
          if (tier && Number.isFinite(tier.price)) {
            return {
              provider: mapping.provider,
              basePrice: tier.price,
              discount: 0,
              finalPrice: tier.price,
              codEnabled: false,
              codPercentage: 0,
              estimatedDays: 2,
              providerUsed: mapping.provider,
            };
          }
          // no exact-band price -> fall through to live courier API below
        }

        const adapter = await this.getAdapter(mapping.provider);

        if (adapter instanceof PathaoAdapter) {
          if (!mapping.courierCityId) {
            this.logger.warn(`Pathao mapping incomplete for ${district}, no city mapped`);
            continue;
          }

          let zones = await this.repository.getZonesByCourierCityId(
            mapping.provider,
            mapping.courierCityId,
          );
          if (!zones || zones.length === 0) {
            const liveZones = await adapter.getZones(mapping.courierCityId);
            if (liveZones.length > 0) {
              const city = await this.repository.getCityByCourierId(
                mapping.provider,
                mapping.courierCityId,
              );
              if (city) {
                await this.repository.syncZones(
                  mapping.provider,
                  city.id,
                  liveZones.map((z) => ({ courierId: z.courierId, name: z.name })),
                );
              }
            }
            zones = liveZones;
          }
          const zoneId = zones.length > 0 ? zones[0].courierId : null;
          if (!zoneId) {
            this.logger.warn(`No zones found for city ${mapping.courierCityName}, skipping`);
            continue;
          }

          const rate = await adapter.calculateRate({
            weightKg,
            cityId: mapping.courierCityId,
            zoneId,
            areaId: mapping.courierAreaId || undefined,
            deliveryType: deliveryType || 'normal',
            codAmount,
          });

          return { ...rate, providerUsed: mapping.provider };
        }
      } catch (error) {
        this.logger.error(`Failed to calculate rate via ${mapping.provider}: ${error.message}`);
        // Fallback to a manual delivery-charge override (closest weight band) when live pricing is unavailable
        if (tiers.length > 0) {
          const fallback = [...tiers].sort(
            (a, b) => Math.abs(a.weightKg - weightKg) - Math.abs(b.weightKg - weightKg),
          )[0];
          if (fallback && Number.isFinite(fallback.price)) {
            this.logger.warn(`Using manual delivery-charge override for ${district} (live pricing failed)`);
            return {
              provider: mapping.provider,
              basePrice: fallback.price,
              discount: 0,
              finalPrice: fallback.price,
              codEnabled: false,
              codPercentage: 0,
              estimatedDays: 2,
              providerUsed: mapping.provider,
            };
          }
        }
        lastError = error as Error;
        continue;
      }
    }

    this.logger.warn(`No delivery rate available for "${district}"; using default ${DEFAULT_DELIVERY_CHARGE}`);
    return {
      provider: 'default',
      basePrice: DEFAULT_DELIVERY_CHARGE,
      discount: 0,
      finalPrice: DEFAULT_DELIVERY_CHARGE,
      codEnabled: false,
      codPercentage: 0,
      estimatedDays: 2,
      providerUsed: 'default',
    };
  }

  async calculateRatesBatch(
    items: { district: string; weightKg: number; codAmount?: number; deliveryType?: string; provider?: string }[],
  ): Promise<Array<{ district: string; weightKg: number; finalPrice: number | null; providerUsed: string | null }>> {
    const allMappings = await this.repository.findAllMappings();
    const mappingByDistrictProvider = new Map<string, any>();
    for (const m of allMappings) {
      if (m.isMapped) mappingByDistrictProvider.set(`${m.district}:${m.provider}`, m);
    }

    const results = new Array(items.length);

    const groupKeyFor = (item: (typeof items)[number], m: any) => {
      const provider = item.provider || m?.provider;
      const locationId = m?.courierCityId;
      return `${provider}:${locationId ?? ''}:${item.weightKg}:${item.deliveryType ?? ''}`;
    };

    const groups = new Map<string, { district: string; weightKg: number; deliveryType?: string; indices: number[] }>();
    items.forEach((item, idx) => {
      const m = item.provider
        ? mappingByDistrictProvider.get(`${item.district}:${item.provider}`)
        : Array.from(mappingByDistrictProvider.keys())
            .filter((k) => k.startsWith(`${item.district}:`))
            .map((k) => mappingByDistrictProvider.get(k)!)[0];
      const key = groupKeyFor(item, m);
      if (!groups.has(key)) {
        groups.set(key, { district: item.district, weightKg: item.weightKg, deliveryType: item.deliveryType, indices: [] });
      }
      groups.get(key)!.indices.push(idx);
    });

    const groupList = Array.from(groups.values());
    const CONCURRENCY = 3;
    let cursor = 0;

    const worker = async () => {
      while (true) {
        const gi = cursor++;
        if (gi >= groupList.length) break;
        const g = groupList[gi];
        try {
          const rate = await this.calculateRate(g.district, g.weightKg, undefined, g.deliveryType);
          for (const i of g.indices) {
            results[i] = {
              district: items[i].district,
              weightKg: g.weightKg,
              finalPrice: rate.finalPrice,
              providerUsed: rate.providerUsed,
            };
          }
        } catch {
          for (const i of g.indices) {
            results[i] = {
              district: items[i].district,
              weightKg: g.weightKg,
              finalPrice: null,
              providerUsed: null,
            };
          }
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, groupList.length) }, () => worker()));
    return results;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createShipment(input: {
    provider: string;
    district: string;
    orderId: string;
    recipientName: string;
    recipientPhone: string;
    recipientAddress: string;
    itemWeight: number;
    itemQuantity: number;
    amountToCollect: number;
    deliveryType?: string;
  }): Promise<CourierOrderResult> {
    if (input.provider !== 'pathao') {
      throw new BadRequestException(
        'Courier shipment is only supported for Pathao in this release',
      );
    }

    const mappings = await this.repository.findMappingsByDistrict(input.district);
    const mapping = mappings.find((m) => m.provider === input.provider && m.isMapped);

    if (!mapping || !mapping.courierCityId) {
      throw new BadRequestException(
        `District "${input.district}" is not mapped to a Pathao city. Configure it in District Mappings.`,
      );
    }

    const adapter = await this.getAdapter(input.provider);

    // Resolve the zone. Prefer the configured zone, otherwise auto-resolve the
    // first available zone for the mapped city — this mirrors calculateRate so
    // districts that were auto-mapped (city set, zone left empty) still work.
    let zoneId: number | null = mapping.courierAreaId ?? null;
    if (!zoneId) {
      let zones = await this.repository.getZonesByCourierCityId(
        input.provider,
        mapping.courierCityId,
      );
      if (!zones || zones.length === 0) {
        const liveZones = await adapter.getZones(mapping.courierCityId);
        if (liveZones.length > 0) {
          const city = await this.repository.getCityByCourierId(
            input.provider,
            mapping.courierCityId,
          );
          if (city) {
            await this.repository.syncZones(
              input.provider,
              city.id,
              liveZones.map((z) => ({ courierId: z.courierId, name: z.name })),
            );
          }
        }
        zones = liveZones;
      }
      zoneId = zones.length > 0 ? zones[0].courierId : null;
    }

    if (!zoneId) {
      throw new BadRequestException(
        `District "${input.district}" has no available Pathao zone. Configure the zone in District Mappings.`,
      );
    }

    return adapter.createOrder({
      orderId: input.orderId,
      recipientName: input.recipientName,
      recipientPhone: input.recipientPhone,
      recipientAddress: input.recipientAddress,
      cityId: mapping.courierCityId,
      zoneId,
      areaId: zoneId,
      deliveryType: input.deliveryType ?? 'normal',
      itemWeight: input.itemWeight,
      itemQuantity: input.itemQuantity,
      amountToCollect: input.amountToCollect,
    });
  }

  /**
   * Fetch the current Pathao shipment status for a consignment id.
   */
  async getShipmentStatus(consignmentId: string) {
    const adapter = await this.getAdapter('pathao');
    return adapter.getOrderInfo(consignmentId);
  }

  /**
   * Build the customer-facing Pathao tracking URL. Uses the `trackingBaseUrl`
   * configured in the Pathao `config` JSON, falling back to the live public
   * tracker. Phone is required by Pathao's tracker, so it is included when
   * available.
   */
  async buildTrackingUrl(consignmentId: string, phone?: string | null, baseUrl?: string): Promise<string> {
    const settings = await this.settingsService.getCredentials('pathao').catch(() => null);
    const base =
      baseUrl ||
      settings?.config?.trackingBaseUrl ||
      'https://merchant.pathao.com/tracking';

    try {
      const url = new URL(base);
      url.searchParams.set('consignment_id', consignmentId);
      if (phone) {
        url.searchParams.set('phone', phone);
      }
      return url.toString();
    } catch {
      const params = new URLSearchParams({ consignment_id: consignmentId });
      if (phone) params.set('phone', phone);
      return `${base}?${params.toString()}`;
    }
  }

  getSyncStatus(provider: string): SyncStatus {
    return this.syncStatuses.get(provider) || { status: 'idle', cities: 0, zones: 0, areas: 0, errors: 0 };
  }

  async syncLocations(provider: string) {
    const existing = this.getSyncStatus(provider);
    if (existing.status === 'syncing') {
      return { syncing: true, message: `Sync already in progress for ${provider}` };
    }

    this.syncStatuses.set(provider, {
      status: 'syncing',
      cities: 0,
      zones: 0,
      areas: 0,
      errors: 0,
      startedAt: new Date(),
    });

    this.runSync(provider).catch((error) => {
      this.logger.error(`Sync failed for ${provider}: ${error.message}`);
      this.syncStatuses.set(provider, {
        ...this.getSyncStatus(provider),
        status: 'failed',
        message: error.message,
        completedAt: new Date(),
      });
    });

    return { syncing: true, message: `Sync started for ${provider}` };
  }

  private async runSync(provider: string) {
    this.clearAdapterCache(provider);
    const adapter = await this.getAdapter(provider);
    const status = () => this.getSyncStatus(provider);

    const cities = await adapter.getCities();
    await this.repository.syncCities(provider, cities);
    this.syncStatuses.set(provider, { ...status(), cities: cities.length });
    this.logger.log(`Synced ${cities.length} cities for ${provider}`);

    this.syncStatuses.set(provider, {
      ...status(),
      status: 'completed',
      completedAt: new Date(),
    });

    this.logger.log(`Sync completed for ${provider}: ${status().cities} cities`);

    try {
      const autoMapResult = await this.autoMapDistricts(provider);
      this.logger.log(`Auto-map: ${autoMapResult.message}`);
    } catch (error) {
      this.logger.warn(`Auto-map failed after sync: ${error.message}`);
    }
  }

  async getMappings() {
    return this.repository.findAllMappings();
  }

  async updateMapping(data: any) {
    await this.repository.upsertMapping(data);
    return { success: true, message: 'Mapping updated' };
  }

  async bulkUpdateMappings(mappings: any[]) {
    await this.repository.bulkUpsertMappings(mappings);
    return { success: true, message: `${mappings.length} mappings updated` };
  }

  async getCities(provider: string) {
    return this.repository.getCities(provider);
  }

  async getZones(provider: string, cityDbId: string) {
    return this.repository.getZones(provider, cityDbId);
  }

  async getAreas(provider: string, zoneDbId: string) {
    return this.repository.getAreas(provider, zoneDbId);
  }

  async getBranches(provider: string) {
    return this.repository.getBranches(provider);
  }

  async autoMapDistricts(provider: string) {
    const cities = await this.repository.getCities(provider);
    if (cities.length === 0) {
      throw new BadRequestException(`No synced cities found for ${provider}. Run sync first.`);
    }

    this.logger.log(`Auto-map: ${cities.length} synced cities`);

    const pathaoCityToDistrict: Record<string, string> = {
      'Kathmandu Valley': 'Kathmandu',
      'Pokhara': 'Kaski',
      'Lakeside (Pokhara)': 'Kaski',
      'Gairapatan (Pokhara)': 'Kaski',
      'Hemja (Pokhara)': 'Kaski',
      'Biratnagar': 'Morang',
      'Birgunj ': 'Parsa',
      'Bhairahawa': 'Rupandehi',
      'Kotihawa (Bhairahawa)': 'Rupandehi',
      'Padsari (Bhairahawa)': 'Rupandehi',
      'Ramgopalpur': 'Rupandehi',
      'Dhangadhi': 'Kailali',
      'Nepalgunj ': 'Banke',
      'Butwal': 'Rupandehi',
      'Tilottama (Lumbini)': 'Rupandehi',
      'Hetauda ': 'Makwanpur',
      'Dharan': 'Sunsari',
      'Itahari': 'Sunsari',
      'Damak': 'Jhapa',
      'Birtamod': 'Jhapa',
      'Budhabare (Birtamode)': 'Jhapa',
      'Jhiljhile (Damak)': 'Jhapa',
      'Janakpur': 'Dhanusha',
      'Janakpur (Mahendranagar)': 'Kanchanpur',
      'Mahendranagar (Kanchanpur)': 'Kanchanpur',
      'Birendranagar (Surkhet)': 'Surkhet',
      'Tulsipur (Dang)': 'Dang',
      'Ghorahi (Dang)': 'Dang',
      'Lamahi (Dang)': 'Dang',
      'Gulariya (Bardiya)': 'Bardiya',
      'Rajapur (Bardiya)': 'Bardiya',
      'Jayanagar (Bardiya)': 'Bardiya',
      'Bhuriguan (Bardiya)': 'Bardiya',
      'Kohalpur (Banke)': 'Banke',
      'Duduwa (Banke)': 'Banke',
      'Gavar (Banke)': 'Banke',
      'Narainapur (Banke)': 'Banke',
      'Piprahawa (Banke)': 'Banke',
      'Khajura (Nepalgunj)': 'Banke',
      'Dipayan': 'Banke',
      'Gauriganga (Dhangadi)': 'Kailali',
      'Tikapur (Kailali)': 'Kailali',
      'Attariya (Kailali)': 'Kailali',
      'Lamki (Kailali)': 'Kailali',
      'Belauri (Kanchanpur)': 'Kanchanpur',
      'Bhimdatta': 'Kanchanpur',
      'Dhulikhel': 'Kavrepalanchok',
      'Banepa': 'Kavrepalanchok',
      'Panchkhal (Kavre)': 'Kavrepalanchok',
      'Bhakundebesi (Kavre)': 'Kavrepalanchok',
      'Sanga (Banepa)': 'Kavrepalanchok',
      'Baidarapur': 'Kavrepalanchok',
      'Sindhuli Bazar': 'Sindhuli',
      'Dudhauli (Sindhuli)': 'Sindhuli',
      'Bhiman (Sindhuli)': 'Sindhuli',
      'Khurkot (Sindhuli)': 'Sindhuli',
      'Ratnanagar (Chitwan)': 'Chitwan',
      'Meghauli (Chitwan)': 'Chitwan',
      'Gaindakot (Chitwan)': 'Chitwan',
      'Tandi (Chitwan)': 'Chitwan',
      'Adarshanagar (Chitwan)': 'Chitwan',
      'Nagarkot': 'Bhaktapur',
      'Sudal (Bhaktapur)': 'Bhaktapur',
      'Bhaktapur': 'Bhaktapur',
      'Lalitpur': 'Lalitpur',
      'Patan (Lalitpur)': 'Lalitpur',
      'Dhunche (Rasuwa)': 'Rasuwa',
      'Lukla': 'Solukhumbu',
      'Namche Bazar (Solukhumbu)': 'Solukhumbu',
      'Solukhumbu': 'Solukhumbu',
      'Bahrabise (Sindhupalchowk)': 'Sindhupalchok',
      'Chautara (Sindhupalchwok)': 'Sindhupalchok',
      'Melamchi (Sindhupalchwok)': 'Sindhupalchok',
      'Tatopani (Sindhupalchowk)': 'Sindhupalchok',
      'Sailung (Sindhupalchowk)': 'Sindhupalchok',
      'Dolakha': 'Dolakha',
      'Dolalghat': 'Rasuwa',
      'Dhading besi': 'Dhading',
      'Dhading Bazar': 'Dhading',
      'Benighat': 'Dhading',
      'Gajuri (Dhading)': 'Dhading',
      'Malekhu (Dhading)': 'Dhading',
      'Mugling': 'Chitwan',
      'Dhakadahi (Bhairahwa)': 'Rupandehi',
      'Dumre': 'Tanahu',
      'Bandipur (Tanahun)': 'Tanahu',
      'Bhimad (Tanahun)': 'Tanahu',
      'Shuklagandaki (Tanhau)': 'Tanahu',
      'Dulegauda (Tanahu)': 'Tanahu',
      'Kawasoti': 'Nawalparasi (East)',
      'Gaindakot': 'Nawalparasi (East)',
      'Dumkibas (Nawalparasi)': 'Nawalparasi (East)',
      'Sunwal': 'Nawalparasi (West)',
      'Besisahar (Lamjung)': 'Lamjung',
      'Lamjung (Sundar Bazar)': 'Lamjung',
      'Sundarbazar (Besisahar)': 'Lamjung',
      'Bhorletar (Lamjung)': 'Lamjung',
      'Gorkha': 'Gorkha',
      'Manakamana (Gorkha)': 'Gorkha',
      'Gulmi Tamghas': 'Gorkha',
      'Kushma (Parbat)': 'Parbat',
      'Baglung ': 'Baglung',
      'Galkot (Baglung)': 'Baglung',
      'Burtibang (Baglung)': 'Baglung',
      'Beni Bazar': 'Myagdi',
      'Jomsom Bazar (Mustang)': 'Mustang',
      'Chame': 'Manang',
      'Dharapani (Manang)': 'Manang',
      'Galyang (Syangja)': 'Syangja',
      'Waling (Syangja)': 'Syangja',
      'Putal Bazar': 'Syangja',
      'Kapilvastu': 'Kapilvastu',
      'Taulihawa (Kapilvastu)': 'Kapilvastu',
      'Gorusinge (kapilvastu)': 'Kapilvastu',
      'Chandrauta (Kapilvastu)': 'Kapilvastu',
      'Jeetpur No.4 (Kapilvastu)': 'Kapilvastu',
      'Krishnanagar (Kapilvastu)': 'Kapilvastu',
      'Motipur (Rupandehi)': 'Rupandehi',
      'Sainamaina (Rupandehi)': 'Rupandehi',
      'Manigram (Rupandehi)': 'Rupandehi',
      'Pharsatikar (Rupandehi)': 'Rupandehi',
      'Jogikuti (Rupandehi)': 'Rupandehi',
      'Ridi Bazar': 'Rupandehi',
      'Siddhababa': 'Rupandehi',
      'Lumbini': 'Rupandehi',
      'Devdaha': 'Rupandehi',
      'Siddharthanagar': 'Rupandehi',
      'Ramgram': 'Nawalparasi (West)',
      'Palpa': 'Palpa',
      'Tansen (Palpa)': 'Palpa',
      'Rampur (Palpa)': 'Palpa',
      'Madi (Palpa)': 'Palpa',
      'Arya Bhanjyang (Palpa)': 'Palpa',
      'Syangja': 'Syangja',
      'Rautahat': 'Rautahat',
      'Gaur (Rautahat)': 'Rautahat',
      'Garuda (Rahutahat)': 'Rautahat',
      'Maulapur': 'Rautahat',
      'Baudhimai': 'Rautahat',
      'Ratuwamai (Sombare)': 'Sunsari',
      'Bhantabari (Sunsari)': 'Sunsari',
      'Khanar (Sunsari)': 'Sunsari',
      'Tarahara (Sunsari)': 'Sunsari',
      'Inaruwa (Sunsari)': 'Sunsari',
      'Kalabanjar (Sunsari)': 'Sunsari',
      'Barahakshetra': 'Sunsari',
      'Fikkal (Ilam)': 'Illam',
      'Pashupatinagar (Ilam)': 'Illam',
      'Ilam': 'Illam',
      'Jhapa': 'Jhapa',
      'Bhadrapur': 'Jhapa',
      'Charaali': 'Jhapa',
      'Chhatara': 'Jhapa',
      'Mechinagar': 'Jhapa',
      'Biratchowk': 'Morang',
      'Pathari Shanishchare': 'Morang',
      'Sundar Dulari': 'Morang',
      'Kanepokhari': 'Morang',
      'Letang': 'Morang',
      'Belbari': 'Morang',
      'Rangeli': 'Morang',
      'Sunawarshi': 'Morang',
      'Siraha Bazar': 'Siraha',
      'Mirchaiya (Siraha)': 'Siraha',
      'Lahan': 'Siraha',
      'Golbazar (Lahan)': 'Siraha',
      'Gauriganj': 'Siraha',
      'Hanumannagar (Saptari)': 'Saptari',
      'Rajbiraj (Saptari)': 'Saptari',
      'Kalyanpur (Saptari)': 'Saptari',
      'Bodebarsain (Saptari)': 'Saptari',
      'Kadamha (Saptari)': 'Saptari',
      'Rupani (Saptari)': 'Saptari',
      'Rupnagar (Saptari)': 'Saptari',
      'Phattepur (Saptari)': 'Saptari',
      'Mahuli (Saptari)': 'Saptari',
      'Arnaha (Saptari)': 'Saptari',
      'Malangwa (Sarlahi)': 'Sarlahi',
      'Haripur Sarlahi': 'Sarlahi',
      'Hariwan (Sarlahi)': 'Sarlahi',
      'Lalbandi (Sarlahi)': 'Sarlahi',
      'Barathwa Sarlahi': 'Sarlahi',
      'Bagmati (Sarlahi)': 'Sarlahi',
      'Gaushala (Mahottari)': 'Mahottari',
      'Bardibas': 'Mahottari',
      'Lalgadh (Bardibas)': 'Mahottari',
      'Aurahi': 'Mahottari',
      'Balisra': 'Mahottari',
      'Dhalkebar (Dhanusa)': 'Dhanusha',
      'Dhanushadham': 'Dhanusha',
      'Janakpurdham': 'Dhanusha',
      'Udayapur': 'Udayapur',
      'Gaighat (Udayapur)': 'Udayapur',
      'Beltar (Udayapur)': 'Udayapur',
      'Rampur thokshila(Udayapur)': 'Udayapur',
      'Diktel Bazar(Khotang)': 'Khotang',
      'Okhaldhunga Bazar': 'Okhaldhunga',
      'Halesi': 'Khotang',
      'Phidim (Panchthar)': 'Panchthar',
      'Phungling (Taplejung)': 'Taplejung',
      'Taplejung Bazar': 'Taplejung',
      'Chainpur (Sankhuwasabha)': 'Sankhuwasabha',
      'Khandbari (Sankhuwasabha)': 'Sankhuwasabha',
      'Tumlingtar (Sankhuwasabha)': 'Sankhuwasabha',
      'Bhojpur Bazar': 'Bhojpur',
      'Dingla (Bhojpur)': 'Bhojpur',
      'Dhankuta ': 'Dhankuta',
      'Hile (Dhankuta)': 'Dhankuta',
      'Sidhuwa (Hile)': 'Dhankuta',
      'Rajarani(Dhankuta)': 'Dhankuta',
      'Pakhribas (Dhankuta)': 'Dhankuta',
      'Basantapur (Terhathum)': 'Terhathum',
      'Myanglung (Terhathum)': 'Terhathum',
      'Tehrathum Bazar': 'Terhathum',
      'Chainpur (Bajhang)': 'Bajhang',
      'Chainpur(Bajhang)': 'Bajhang',
      'Dipayal (Doti)': 'Doti',
      'Rajpur Dipayal (Doti)': 'Doti',
      'Darchula': 'Darchula',
      'Gokuleshwar (Baitadi)': 'Baitadi',
      'Patan (Baitadi)': 'Baitadi',
      'Shahilek (Baitadi)': 'Baitadi',
      'Gothalapani (Baitadi)': 'Baitadi',
      'Dadeldhura': 'Dadeldhura',
      'Mangalsen (Achham)': 'Achham',
      'Sanfebazar(Achham)': 'Achham',
      'Bajura': 'Bajura',
      'Kolti': 'Bajura',
      'Manma': 'Kalikot',
      'Jajarkot Bazar': 'Jajarkot',
      'Dailekh Bazar': 'Dailekh',
      'Surkhet': 'Surkhet',
      'Mehelkuna (Surkhet)': 'Surkhet',
      'Bheri': 'Salyan',
      'Khalanga (Salyan)': 'Salyan',
      'Salyaan': 'Salyan',
      'Chaurjahari(Rukum)': 'Rukum (East)',
      'Khalanga (Rukum)': 'Rukum (East)',
      'Rukumkot': 'Rukum (East)',
      'Khalanga (Darchula)': 'Darchula',
      'Liwang (Rolpa)': 'Rolpa',
      'Sulichaur (Rolpa)': 'Rolpa',
      'Bhingri(Pyuthan)': 'Pyuthan',
      'Musikot': 'Pyuthan',
      'Dunai (Dolpa)': 'Dolpa',
      'Shey Phoksundo': 'Dolpa',
      'Simikot (Humla)': 'Humla',
      'Jumla Bazar': 'Jumla',
      'Raskot': 'Kalikot',
      'Mugu': 'Mugu',
      'Panchthar': 'Panchthar',
      'Sindhuli': 'Sindhuli',
      'Makwanpur': 'Makwanpur',
      'Daman': 'Makwanpur',
      'Bara': 'Bara',
      'Simara (Bara)': 'Bara',
      'Jeetpur (Bara)': 'Bara',
      'Nijgadh (Bara)': 'Bara',
      'Pathlaiya (Bara)': 'Bara',
      'Kalaiya (Bara)': 'Bara',
      'Kolhabi (Bara)': 'Bara',
      'Parsa': 'Parsa',
      'Bardiya': 'Bardiya',
      'Banke': 'Banke',
      'Lamjung': 'Lamjung',
      'Gulmi': 'Gorkha',
      'Arghakhanchi': 'Rupandehi',
      'Sandhikharka (Arghakhanchi)': 'Rupandehi',
    };

    const districtProvinceMap: Record<string, number> = {
      'Taplejung': 1, 'Sankhuwasabha': 1, 'Bhojpur': 1, 'Dhankuta': 1, 'Terhathum': 1,
      'Panchthar': 1, 'Ilam': 1, 'Jhapa': 1, 'Morang': 1, 'Sunsari': 1,
      'Udayapur': 1, 'Saptari': 2, 'Siraha': 2, 'Dhanusha': 2, 'Mahottari': 2,
      'Sarlahi': 2, 'Rautahat': 2, 'Bara': 2, 'Parsa': 2, 'Chitwan': 3,
      'Kathmandu': 3, 'Lalitpur': 3, 'Bhaktapur': 3, 'Nuwakot': 3, 'Rasuwa': 3,
      'Sindhupalchok': 3, 'Dolakha': 3, 'Kavrepalanchok': 3, 'Makwanpur': 3,
      'Pokhara': 4, 'Kaski': 4, 'Tanahu': 4, 'Nawalparasi (East)': 4, 'Lamjung': 4,
      'Gorkha': 4, 'Myagdi': 4, 'Parbat': 4, 'Baglung': 4, 'Mustang': 4,
      'Manang': 4, 'Syangja': 4, 'Palpa': 4,
      'Kapilvastu': 5, 'Rupandehi': 5, 'Nawalparasi (West)': 5, 'Rukum (East)': 5,
      'Salyan': 5, 'Dang': 5, 'Pyuthan': 5, 'Rolpa': 5, 'Banke': 5, 'Bardiya': 5,
      'Surkhet': 6, 'Dailekh': 6, 'Jumla': 6, 'Mugu': 6, 'Dolpa': 6,
      'Humla': 6, 'Kalikot': 6, 'Jajarkot': 6,
      'Kailali': 7, 'Kanchanpur': 7, 'Darchula': 7, 'Baitadi': 7, 'Dadeldhura': 7,
      'Bajhang': 7, 'Bajura': 7, 'Doti': 7, 'Achham': 7,
    };

    const cityToDistrict = provider === 'pathao' ? pathaoCityToDistrict : {};

    const cityToDistricts: Record<string, string[]> = {
      'Kathmandu Valley': ['Kathmandu', 'Lalitpur', 'Bhaktapur'],
    };

    const mappings: any[] = [];
    let matched = 0;

    for (const [district, provinceId] of Object.entries(districtProvinceMap)) {
      let matchedCity = cities.find((city) => {
        const multiDistricts = cityToDistricts[city.name];
        if (multiDistricts?.includes(district)) return true;
        const direct = cityToDistrict[city.name];
        if (direct === district) return true;
        const cityName = city.name.toLowerCase().replace(/\s+/g, ' ').trim();
        const d = district.toLowerCase().trim();
        return cityName === d || cityName.includes(d) || d.includes(cityName);
      });

      if (matchedCity) {
        mappings.push({
          district,
          provider,
          provinceId,
          courierCityId: matchedCity.courierId,
          courierCityName: matchedCity.name,
          courierAreaId: null,
          courierAreaName: null,
          courierBranch: null,
          isMapped: true,
        });
        matched++;
      } else {
        mappings.push({
          district,
          provider,
          provinceId,
          courierCityId: null,
          courierCityName: null,
          courierAreaId: null,
          courierAreaName: null,
          courierBranch: null,
          isMapped: false,
        });
      }
    }

    await this.repository.bulkUpsertMappings(mappings);

    return {
      total: mappings.length,
      matched,
      unmatched: mappings.length - matched,
      message: `Auto-mapped ${matched}/${mappings.length} districts`,
    };
  }
}
