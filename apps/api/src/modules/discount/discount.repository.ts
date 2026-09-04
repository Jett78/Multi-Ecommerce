import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, and, or, sql, desc, count, gte, lte, lt, ilike } from 'drizzle-orm';

@Injectable()
export class DiscountRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findByCode(code: string) {
    const normalizedCode = code.toUpperCase().trim();
    const [coupon] = await this.db
      .select()
      .from(schema.coupons)
      .where(eq(schema.coupons.code, normalizedCode));
    return coupon || null;
  }

  async findById(id: string) {
    const [coupon] = await this.db
      .select()
      .from(schema.coupons)
      .where(eq(schema.coupons.id, id));
    return coupon || null;
  }

  async findAll(page: number = 1, limit: number = 20, search?: string) {
    const offset = (page - 1) * limit;

    const searchCondition = search
      ? or(
          ilike(schema.coupons.code, `%${search}%`),
          ilike(schema.coupons.description, `%${search}%`),
        )
      : undefined;

    const whereClause = searchCondition ? and(searchCondition) : undefined;

    const coupons = await this.db
      .select()
      .from(schema.coupons)
      .where(whereClause)
      .orderBy(desc(schema.coupons.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(schema.coupons)
      .where(whereClause);

    return {
      coupons,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findActive() {
    const now = new Date();
    return this.db
      .select()
      .from(schema.coupons)
      .where(
        and(
          eq(schema.coupons.isActive, true),
          or(
            sql`${schema.coupons.startsAt} IS NULL`,
            lte(schema.coupons.startsAt, now),
          ),
          or(
            sql`${schema.coupons.expiresAt} IS NULL`,
            gte(schema.coupons.expiresAt, now),
          ),
        )
      )
      .orderBy(desc(schema.coupons.createdAt));
  }

  async create(data: {
    code: string;
    type: string;
    value: number;
    minOrderAmount?: number;
    maxDiscountAmount?: number;
    usageLimit?: number;
    perUserLimit?: number;
    productIds?: string[];
    categoryIds?: string[];
    brandIds?: string[];
    filterLogic?: string;
    startsAt?: Date;
    expiresAt?: Date;
    isActive?: boolean;
    description?: string;
  }) {
    const [coupon] = await this.db
      .insert(schema.coupons)
      .values({
        code: data.code.toUpperCase().trim(),
        type: data.type as any,
        value: data.value,
        minOrderAmount: data.minOrderAmount ?? null,
        maxDiscountAmount: data.maxDiscountAmount ?? null,
        usageLimit: data.usageLimit ?? null,
        usageCount: 0,
        perUserLimit: data.perUserLimit ?? null,
        productIds: data.productIds ?? null,
        categoryIds: data.categoryIds ?? null,
        brandIds: data.brandIds ?? null,
        filterLogic: data.filterLogic ?? 'and',
        startsAt: data.startsAt ?? null,
        expiresAt: data.expiresAt ?? null,
        isActive: data.isActive ?? true,
        description: data.description ?? null,
      })
      .returning();

    return coupon;
  }

  async update(id: string, data: Partial<{
    code: string;
    type: string;
    value: number;
    minOrderAmount: number | null;
    maxDiscountAmount: number | null;
    usageLimit: number | null;
    perUserLimit: number | null;
    productIds: string[] | null;
    categoryIds: string[] | null;
    brandIds: string[] | null;
    filterLogic: string;
    startsAt: Date | null;
    expiresAt: Date | null;
    isActive: boolean;
    description: string | null;
  }>) {
    const updateData: any = { updatedAt: new Date() };
    if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderAmount !== undefined) updateData.minOrderAmount = data.minOrderAmount;
    if (data.maxDiscountAmount !== undefined) updateData.maxDiscountAmount = data.maxDiscountAmount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.perUserLimit !== undefined) updateData.perUserLimit = data.perUserLimit;
    if (data.productIds !== undefined) updateData.productIds = data.productIds;
    if (data.categoryIds !== undefined) updateData.categoryIds = data.categoryIds;
    if (data.brandIds !== undefined) updateData.brandIds = data.brandIds;
    if (data.filterLogic !== undefined) updateData.filterLogic = data.filterLogic;
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt;
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.description !== undefined) updateData.description = data.description;

    const [updated] = await this.db
      .update(schema.coupons)
      .set(updateData)
      .where(eq(schema.coupons.id, id))
      .returning();

    return updated;
  }

  async delete(id: string) {
    const [deleted] = await this.db
      .delete(schema.coupons)
      .where(eq(schema.coupons.id, id))
      .returning();
    return deleted;
  }

  async incrementUsageCount(id: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    await db
      .update(schema.coupons)
      .set({ usageCount: sql`${schema.coupons.usageCount} + 1`, updatedAt: new Date() })
      .where(eq(schema.coupons.id, id));
  }

  async countUserCouponUsage(userId: string, couponId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(schema.orderCoupons)
      .innerJoin(schema.orders, eq(schema.orderCoupons.orderId, schema.orders.id))
      .where(
        and(
          eq(schema.orderCoupons.couponId, couponId),
          eq(schema.orders.userId, userId),
        )
      );
    return result[0]?.count || 0;
  }

  async createOrderCoupon(data: {
    orderId: string;
    couponId: string;
    couponCode: string;
    discountAmount: number;
  }, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const [record] = await db
      .insert(schema.orderCoupons)
      .values({
        orderId: data.orderId,
        couponId: data.couponId,
        couponCode: data.couponCode,
        discountAmount: data.discountAmount,
      })
      .returning();
    return record;
  }
}
