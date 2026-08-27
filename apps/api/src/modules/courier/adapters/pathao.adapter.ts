import { Logger } from '@nestjs/common';
import {
  CourierAdapter,
  CourierCity,
  CourierZone,
  CourierArea,
  CourierBranch,
  DeliveryRateParams,
  DeliveryRate,
  CourierOrderParams,
  CourierOrderResult,
} from './courier.adapter';

interface PathaoCredentials {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
}

interface PathaoConfig {
  storeId: string;
}

export class PathaoAdapter extends CourierAdapter {
  readonly name = 'pathao';
  private readonly logger = new Logger(PathaoAdapter.name);
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  private readonly cacheTtlMs = 15 * 60 * 1000;
  private zoneCache = new Map<number, { zones: CourierZone[]; expiresAt: number }>();
  private priceCache = new Map<string, { rate: DeliveryRate; expiresAt: number }>();

  private readonly minRequestGapMs = 1500;
  private readonly cooldownMs = 10000;
  private lastRequestAt = 0;
  private cooldownUntil = 0;
  private requestQueue: Array<() => Promise<void>> = [];
  private draining = false;

  private enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          resolve(await task());
        } catch (err) {
          reject(err);
        }
      });
      void this.drain();
    });
  }

  private async drain(): Promise<void> {
    if (this.draining) return;
    this.draining = true;
    try {
      while (this.requestQueue.length > 0) {
        const wait = Math.max(
          0,
          this.minRequestGapMs - (Date.now() - this.lastRequestAt),
          this.cooldownUntil - Date.now(),
        );
        if (wait > 0) await this.delay(wait);
        const job = this.requestQueue.shift()!;
        this.lastRequestAt = Date.now();
        await job();
      }
    } finally {
      this.draining = false;
    }
  }

  constructor(
    private apiBaseUrl: string,
    private credentials: PathaoCredentials,
    private config: PathaoConfig,
  ) {
    super();
  }

  private async authenticate(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    if (!this.credentials.clientId || !this.credentials.clientSecret || !this.credentials.username || !this.credentials.password) {
      throw new Error('Pathao credentials incomplete. Please configure client_id, client_secret, username, and password in Courier Settings.');
    }

    const url = `${this.apiBaseUrl}/aladdin/api/v1/issue-token`;
    this.logger.log(`Pathao auth: POST ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: this.credentials.clientId,
        client_secret: this.credentials.clientSecret,
        username: this.credentials.username,
        password: this.credentials.password,
        grant_type: 'password',
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      this.logger.error(`Pathao auth failed: ${response.status}`, JSON.stringify(data));
      throw new Error(`Pathao auth failed: ${response.status} - ${JSON.stringify(data)}`);
    }

    this.token = data.data?.access_token || data.access_token;
    this.tokenExpiresAt = Date.now() + (data.data?.expires_in || data.expires_in || 3600) * 1000 - 60000;

    if (!this.token) {
      throw new Error('Pathao auth failed: no token returned');
    }

    return this.token;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async apiGet(path: string, retries = 3): Promise<any> {
    return this.enqueue(() => this.rawGet(path, retries));
  }

  private async rawGet(path: string, retries = 3): Promise<any> {
    const token = await this.authenticate();

    for (let attempt = 0; attempt <= retries; attempt++) {
      const response = await fetch(`${this.apiBaseUrl}${path}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 3000 + Math.floor(Math.random() * 500);
        this.cooldownUntil = Date.now() + this.cooldownMs;
        this.logger.warn(`Pathao rate limited on ${path}, pausing queue ${this.cooldownMs}ms (attempt ${attempt + 1}/${retries})`);
        await this.delay(waitMs);
        continue;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(`Pathao API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data.data;
    }

    throw new Error(`Pathao API error: rate limit exceeded after ${retries} retries on ${path}`);
  }

  private async apiPost(path: string, body: any): Promise<any> {
    return this.enqueue(() => this.rawPost(path, body));
  }

  private async rawPost(path: string, body: any): Promise<any> {
    const token = await this.authenticate();

    for (let attempt = 0; attempt <= 3; attempt++) {
      const response = await fetch(`${this.apiBaseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 3000 + Math.floor(Math.random() * 500);
        this.cooldownUntil = Date.now() + this.cooldownMs;
        this.logger.warn(`Pathao rate limited on ${path}, pausing queue ${this.cooldownMs}ms (attempt ${attempt + 1}/3)`);
        await this.delay(waitMs);
        continue;
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(`Pathao API error: ${response.status} - ${JSON.stringify(error)}`);
      }

      const data = await response.json();
      return data;
    }

    throw new Error(`Pathao API error: rate limit exceeded after 3 retries on ${path}`);
  }

  async getCities(): Promise<CourierCity[]> {
    const response = await this.apiGet('/aladdin/api/v1/city-list');
    const cities = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response) ? response : [];
    return cities.map((c: any) => ({
      courierId: c.city_id,
      name: c.city_name,
    }));
  }

  async getZones(cityId: number): Promise<CourierZone[]> {
    const cached = this.zoneCache.get(cityId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.zones;
    }
    const response = await this.apiGet(`/aladdin/api/v1/cities/${cityId}/zone-list`);
    const zones = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response) ? response : [];
    const mapped = zones.map((z: any) => ({
      courierId: z.zone_id,
      name: z.zone_name,
      cityCourierId: cityId,
    }));
    this.zoneCache.set(cityId, { zones: mapped, expiresAt: Date.now() + this.cacheTtlMs });
    return mapped;
  }

  async getAreas(zoneId: number): Promise<CourierArea[]> {
    const response = await this.apiGet(`/aladdin/api/v1/zones/${zoneId}/area-list`);
    const areas = Array.isArray(response?.data) ? response.data : Array.isArray(response?.data?.data) ? response.data.data : Array.isArray(response) ? response : [];
    return areas.map((a: any) => ({
      courierId: a.area_id,
      name: a.area_name,
      zoneCourierId: zoneId,
      homeDelivery: !!a.home_delivery_available,
      pickup: !!a.pickup_available,
    }));
  }

  async getBranches(): Promise<CourierBranch[]> {
    this.logger.warn('Pathao does not have a branches endpoint');
    return [];
  }

  async calculateRate(params: DeliveryRateParams): Promise<DeliveryRate> {
    const cacheKey = `${params.cityId}:${params.zoneId}:${params.weightKg}:${params.deliveryType}:${params.areaId ?? ''}`;
    const cached = this.priceCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.rate, provider: this.name };
    }

    const body: any = {
      store_id: parseInt(this.config.storeId),
      item_type: 2,
      delivery_type: params.deliveryType === 'on_demand' ? 12 : 48,
      item_weight: params.weightKg,
      recipient_city: params.cityId,
      recipient_zone: params.zoneId,
    };

    if (params.areaId) {
      body.recipient_area = params.areaId;
    }

    const response = await this.apiPost('/aladdin/api/v1/merchant/price-plan', body);
    const data = response?.data || response;

    const rate: DeliveryRate = {
      provider: this.name,
      basePrice: Math.round(data.price),
      discount: Math.round(data.discount || 0),
      finalPrice: Math.round(data.final_price),
      codEnabled: !!data.cod_enabled,
      codPercentage: data.cod_percentage || 0,
      estimatedDays: params.deliveryType === 'on_demand' ? 1 : 2,
    };

    this.priceCache.set(cacheKey, { rate, expiresAt: Date.now() + this.cacheTtlMs });
    return rate;
  }

  async createOrder(params: CourierOrderParams): Promise<CourierOrderResult> {
    const body: any = {
      store_id: parseInt(this.config.storeId),
      merchant_order_id: params.orderId,
      recipient_name: params.recipientName,
      recipient_phone: params.recipientPhone,
      recipient_address: params.recipientAddress,
      delivery_type: params.deliveryType === 'on_demand' ? 12 : 48,
      item_type: 2,
      item_quantity: params.itemQuantity,
      item_weight: params.itemWeight,
      amount_to_collect: params.amountToCollect,
    };

    if (params.cityId) body.recipient_city = params.cityId;
    if (params.zoneId) body.recipient_zone = params.zoneId;
    if (params.areaId) body.recipient_area = params.areaId;
    if (params.itemDescription) body.item_description = params.itemDescription;
    if (params.specialInstruction) body.special_instruction = params.specialInstruction;

    const response = await this.apiPost('/aladdin/api/v1/orders', body);
    const data = response?.data || response;

    return {
      consignmentId: data.consignment_id,
      deliveryFee: data.delivery_fee || 0,
      status: data.order_status || 'Pending',
    };
  }

  async getOrderInfo(consignmentId: string): Promise<{
    consignmentId: string;
    orderStatus: string;
    orderStatusSlug: string;
    invoiceId?: string;
    updatedAt?: string;
  }> {
    const response = await this.apiGet(`/aladdin/api/v1/orders/${consignmentId}/info`);
    const data = response?.data || response || {};
    return {
      consignmentId: data.consignment_id || consignmentId,
      orderStatus: data.order_status || '',
      orderStatusSlug: data.order_status_slug || data.order_status || '',
      invoiceId: data.invoice_id,
      updatedAt: data.updated_at,
    };
  }
}
