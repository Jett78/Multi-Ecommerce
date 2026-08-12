import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, sql, desc } from 'drizzle-orm';

@Injectable()
export class ReviewRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createReview(data: typeof schema.productReviews.$inferInsert) {
    const [review] = await this.db.insert(schema.productReviews).values(data).returning();
    return review;
  }

  async findReviewById(id: string) {
    const [review] = await this.db
      .select()
      .from(schema.productReviews)
      .where(eq(schema.productReviews.id, id));

    return review || null;
  }

  async findAllReviewsByProductId(productId: string, params?: {
    skip?: number;
    take?: number;
    rating?: number;
    isApproved?: boolean;
  }) {
    const conditions = [eq(schema.productReviews.productId, productId)];

    if (params?.rating) {
      conditions.push(eq(schema.productReviews.rating, params.rating));
    }

    if (params?.isApproved !== undefined) {
      conditions.push(eq(schema.productReviews.isApproved, params.isApproved));
    }

    const whereClause = sql`${conditions.join(' AND ')}`;

    const reviews = await this.db
      .select()
      .from(schema.productReviews)
      .where(whereClause)
      .orderBy(desc(schema.productReviews.createdAt))
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return reviews;
  }

  async countReviewsByProductId(productId: string, params?: { rating?: number; isApproved?: boolean }) {
    const conditions = [eq(schema.productReviews.productId, productId)];

    if (params?.rating) {
      conditions.push(eq(schema.productReviews.rating, params.rating));
    }

    if (params?.isApproved !== undefined) {
      conditions.push(eq(schema.productReviews.isApproved, params.isApproved));
    }

    const whereClause = sql`${conditions.join(' AND ')}`;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.productReviews)
      .where(whereClause);

    return Number(result.count);
  }

  async getAverageRating(productId: string) {
    const [result] = await this.db
      .select({
        avgRating: sql<number>`COALESCE(AVG(${schema.productReviews.rating}), 0)`,
        totalReviews: sql<number>`COUNT(*)`,
      })
      .from(schema.productReviews)
      .where(eq(schema.productReviews.productId, productId));

    return {
      avgRating: Number(result.avgRating),
      totalReviews: Number(result.totalReviews),
    };
  }

  async updateReview(id: string, data: Partial<typeof schema.productReviews.$inferInsert>) {
    const [review] = await this.db
      .update(schema.productReviews)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.productReviews.id, id))
      .returning();

    return review;
  }

  async deleteReview(id: string) {
    const [review] = await this.db
      .delete(schema.productReviews)
      .where(eq(schema.productReviews.id, id))
      .returning();

    return review;
  }

  async hasUserPurchasedProduct(userId: string, productId: string) {
    const result = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .where(
        sql`${schema.orders.userId} = ${userId} 
        AND ${schema.orderItems.variantId} IN (
          SELECT id FROM product_variants WHERE product_id = ${productId}
        )
        AND ${schema.orders.status} = 'completed'`
      );

    return Number(result[0]?.count) > 0;
  }

  async incrementHelpfulCount(id: string) {
    const [review] = await this.db
      .update(schema.productReviews)
      .set({
        helpfulCount: sql`${schema.productReviews.helpfulCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(schema.productReviews.id, id))
      .returning();

    return review;
  }
}
