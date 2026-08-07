import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, ilike, or, and, sql, desc } from 'drizzle-orm';

@Injectable()
export class BrandRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(data: typeof schema.brands.$inferInsert) {
    const [brand] = await this.db.insert(schema.brands).values(data).returning();
    return brand;
  }

  async findById(id: string) {
    const [brand] = await this.db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.id, id));

    return brand || null;
  }

  async findMaxSortOrder(): Promise<number> {
    const [result] = await this.db
      .select({ maxSort: sql<number>`coalesce(max(${schema.brands.sortOrder}), 0)` })
      .from(schema.brands);

    return Number(result.maxSort);
  }

  async swapSortOrder(oldSortOrder: number, newSortOrder: number) {
    const [displaced] = await this.db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.sortOrder, newSortOrder));

    if (displaced) {
      await this.db
        .update(schema.brands)
        .set({ sortOrder: oldSortOrder, updatedAt: new Date() })
        .where(eq(schema.brands.id, displaced.id));
    }
  }

  async findAll(params?: {
    skip?: number;
    take?: number;
    search?: string;
    isActive?: boolean;
  }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(ilike(schema.brands.name, `%${params.search}%`));
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(schema.brands.isActive, params.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const brands = await this.db
      .select()
      .from(schema.brands)
      .where(whereClause)
      .orderBy(schema.brands.sortOrder)
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return brands;
  }

  async count(params?: { search?: string; isActive?: boolean }) {
    const conditions = [];

    if (params?.search) {
      conditions.push(ilike(schema.brands.name, `%${params.search}%`));
    }

    if (params?.isActive !== undefined) {
      conditions.push(eq(schema.brands.isActive, params.isActive));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.brands)
      .where(whereClause);

    return Number(result.count);
  }

  async update(id: string, data: Partial<typeof schema.brands.$inferInsert>) {
    const [brand] = await this.db
      .update(schema.brands)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.brands.id, id))
      .returning();

    return brand;
  }

  async delete(id: string) {
    const [brand] = await this.db
      .delete(schema.brands)
      .where(eq(schema.brands.id, id))
      .returning();

    return brand;
  }

  async reorderAfterDelete(deletedSortOrder: number) {
    await this.db
      .update(schema.brands)
      .set({ sortOrder: sql`${schema.brands.sortOrder} - 1`, updatedAt: new Date() })
      .where(sql`${schema.brands.sortOrder} > ${deletedSortOrder}`);
  }
}
