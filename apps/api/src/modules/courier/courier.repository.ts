import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, and } from 'drizzle-orm';

@Injectable()
export class CourierRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findMappingsByDistrict(district: string) {
    return this.db
      .select()
      .from(schema.courierDistrictMappings)
      .where(eq(schema.courierDistrictMappings.district, district));
  }

  async findMappingsByDistrictAndProvider(district: string, provider: string) {
    return this.db
      .select()
      .from(schema.courierDistrictMappings)
      .where(
        and(
          eq(schema.courierDistrictMappings.district, district),
          eq(schema.courierDistrictMappings.provider, provider),
        ),
      );
  }

  async findAllMappings() {
    return this.db.select().from(schema.courierDistrictMappings);
  }

  async upsertMapping(data: typeof schema.courierDistrictMappings.$inferInsert) {
    const existing = await this.findMappingsByDistrictAndProvider(
      data.district,
      data.provider,
    );

    if (existing.length > 0) {
      await this.db
        .update(schema.courierDistrictMappings)
        .set({
          courierCityId: data.courierCityId,
          courierCityName: data.courierCityName,
          courierAreaId: data.courierAreaId,
          courierAreaName: data.courierAreaName,
          courierBranch: data.courierBranch,
          deliveryChargeOverrides: data.deliveryChargeOverrides ?? null,
          isMapped: data.isMapped || false,
          updatedAt: new Date(),
        })
        .where(eq(schema.courierDistrictMappings.id, existing[0].id));
    } else {
      await this.db.insert(schema.courierDistrictMappings).values(data);
    }
  }

  async bulkUpsertMappings(mappings: typeof schema.courierDistrictMappings.$inferInsert[]) {
    for (const mapping of mappings) {
      await this.upsertMapping(mapping);
    }
  }

  async syncCities(provider: string, cities: { courierId: number; name: string }[]) {
    await this.db
      .delete(schema.courierCities)
      .where(eq(schema.courierCities.provider, provider));

    if (cities.length > 0) {
      await this.db.insert(schema.courierCities).values(
        cities.map((c) => ({
          provider,
          courierId: c.courierId,
          name: c.name,
        })),
      );
    }
  }

  async syncZones(provider: string, cityDbId: string, zones: { courierId: number; name: string }[]) {
    await this.db
      .delete(schema.courierZones)
      .where(
        and(
          eq(schema.courierZones.provider, provider),
          eq(schema.courierZones.cityId, cityDbId),
        ),
      );

    if (zones.length > 0) {
      await this.db.insert(schema.courierZones).values(
        zones.map((z) => ({
          provider,
          cityId: cityDbId,
          courierId: z.courierId,
          name: z.name,
        })),
      );
    }
  }

  async syncAreas(provider: string, zoneDbId: string, areas: { courierId: number; name: string; homeDelivery: boolean; pickup: boolean }[]) {
    await this.db
      .delete(schema.courierAreas)
      .where(
        and(
          eq(schema.courierAreas.provider, provider),
          eq(schema.courierAreas.zoneId, zoneDbId),
        ),
      );

    if (areas.length > 0) {
      await this.db.insert(schema.courierAreas).values(
        areas.map((a) => ({
          provider,
          zoneId: zoneDbId,
          courierId: a.courierId,
          name: a.name,
          homeDelivery: a.homeDelivery,
          pickup: a.pickup,
        })),
      );
    }
  }

  async syncBranches(provider: string, branches: { name: string; district: string; phone: string; address: string }[]) {
    await this.db
      .delete(schema.courierBranches)
      .where(eq(schema.courierBranches.provider, provider));

    if (branches.length > 0) {
      await this.db.insert(schema.courierBranches).values(
        branches.map((b) => ({
          provider,
          name: b.name,
          district: b.district,
          phone: b.phone,
          address: b.address,
        })),
      );
    }
  }

  async getCities(provider: string) {
    return this.db
      .select()
      .from(schema.courierCities)
      .where(eq(schema.courierCities.provider, provider));
  }

  async getZones(provider: string, cityDbId: string) {
    return this.db
      .select()
      .from(schema.courierZones)
      .where(
        and(
          eq(schema.courierZones.provider, provider),
          eq(schema.courierZones.cityId, cityDbId),
        ),
      );
  }

  async getCityByCourierId(provider: string, courierCityId: number) {
    const rows = await this.db
      .select()
      .from(schema.courierCities)
      .where(
        and(
          eq(schema.courierCities.provider, provider),
          eq(schema.courierCities.courierId, courierCityId),
        ),
      );
    return rows[0];
  }

  async getZonesByCourierCityId(provider: string, courierCityId: number) {
    const cities = await this.db
      .select({ id: schema.courierCities.id })
      .from(schema.courierCities)
      .where(
        and(
          eq(schema.courierCities.provider, provider),
          eq(schema.courierCities.courierId, courierCityId),
        ),
      );
    const cityDbId = cities[0]?.id;
    if (!cityDbId) return [];
    const zones = await this.db
      .select({
        courierId: schema.courierZones.courierId,
        name: schema.courierZones.name,
        cityCourierId: schema.courierCities.courierId,
      })
      .from(schema.courierZones)
      .innerJoin(
        schema.courierCities,
        eq(schema.courierZones.cityId, schema.courierCities.id),
      )
      .where(
        and(
          eq(schema.courierZones.provider, provider),
          eq(schema.courierZones.cityId, cityDbId),
        ),
      );
    return zones;
  }

  async getAreas(provider: string, zoneDbId: string) {
    return this.db
      .select()
      .from(schema.courierAreas)
      .where(
        and(
          eq(schema.courierAreas.provider, provider),
          eq(schema.courierAreas.zoneId, zoneDbId),
        ),
      );
  }

  async getBranches(provider: string) {
    return this.db
      .select()
      .from(schema.courierBranches)
      .where(eq(schema.courierBranches.provider, provider));
  }
}
