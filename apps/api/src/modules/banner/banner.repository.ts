import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, ilike, or, and, sql } from 'drizzle-orm';

@Injectable()
export class BannerRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: typeof schema.banners.$inferInsert) {
    const [banner] = await this.db.insert(schema.banners).values(data).returning();
    return banner;
  }

  async findById(id: string) {
    const [banner] = await this.db
      .select()
      .from(schema.banners)
      .where(eq(schema.banners.id, id));

    return banner || null;
  }

  async findMaxSortOrder(): Promise<number> {
    const [result] = await this.db
      .select({ maxSort: sql<number>`coalesce(max(${schema.banners.sortOrder}), 0)` })
      .from(schema.banners);

    return Number(result.maxSort);
  }

  async swapSortOrder(oldSortOrder: number, newSortOrder: number) {
    const [displaced] = await this.db
      .select()
      .from(schema.banners)
      .where(eq(schema.banners.sortOrder, newSortOrder));

    if (displaced) {
      await this.db
        .update(schema.banners)
        .set({ sortOrder: oldSortOrder, updatedAt: new Date() })
        .where(eq(schema.banners.id, displaced.id));
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.banners.title, `%${params.search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const banners = await this.db
      .select()
      .from(schema.banners)
      .where(whereClause)
      .orderBy(schema.banners.sortOrder)
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return banners;
  }

  async count(params?: { search?: string }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(
        or(
          ilike(schema.banners.title, `%${params.search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.banners)
      .where(whereClause);

    return Number(result.count);
  }

  async update(id: string, data: Partial<typeof schema.banners.$inferInsert>) {
    const [banner] = await this.db
      .update(schema.banners)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.banners.id, id))
      .returning();

    return banner;
  }

  async delete(id: string) {
    const [banner] = await this.db
      .delete(schema.banners)
      .where(eq(schema.banners.id, id))
      .returning();

    return banner;
  }

  async reorderAfterDelete(deletedSortOrder: number) {
    await this.db
      .update(schema.banners)
      .set({ sortOrder: sql`${schema.banners.sortOrder} - 1`, updatedAt: new Date() })
      .where(sql`${schema.banners.sortOrder} > ${deletedSortOrder}`);
  }
}
