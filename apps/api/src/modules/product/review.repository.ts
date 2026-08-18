import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, sql, desc, and } from 'drizzle-orm';

@Injectable()
export class ReviewRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private buildImageUrl(key: string): string {
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL || '';
    const bucketName = process.env.S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-south-1';

    if (cloudfrontUrl) {
      return `https://${cloudfrontUrl}/${key}`;
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.productReviews)
      .where(whereClause);

    return Number(result.count);
  }

  async findAllReviews(productId?: string, params?: {
    skip?: number;
    take?: number;
    rating?: number;
    isApproved?: boolean;
  }) {
    const conditions = [];
    
    if (productId) {
      conditions.push(eq(schema.productReviews.productId, productId));
    }

    if (params?.rating) {
      conditions.push(eq(schema.productReviews.rating, params.rating));
    }

    if (params?.isApproved !== undefined) {
      conditions.push(eq(schema.productReviews.isApproved, params.isApproved));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const reviews = await this.db
      .select({
        id: schema.productReviews.id,
        productId: schema.productReviews.productId,
        userId: schema.productReviews.userId,
        rating: schema.productReviews.rating,
        title: schema.productReviews.title,
        comment: schema.productReviews.comment,
        images: schema.productReviews.images,
        isVerifiedPurchase: schema.productReviews.isVerifiedPurchase,
        isApproved: schema.productReviews.isApproved,
        helpfulCount: schema.productReviews.helpfulCount,
        createdAt: schema.productReviews.createdAt,
        updatedAt: schema.productReviews.updatedAt,
        productName: schema.products.name,
        productImage: schema.productImages.imageKey,
        userName: schema.user.name,
        userEmail: schema.user.email,
        userPhone: schema.user.phone,
        userImage: schema.user.image,
        userRole: schema.user.role,
        isEmailVerified: schema.user.emailVerified,
      })
      .from(schema.productReviews)
      .leftJoin(schema.products, eq(schema.productReviews.productId, schema.products.id))
      .leftJoin(schema.productImages, and(
        eq(schema.productImages.productId, schema.products.id),
        eq(schema.productImages.isPrimary, true)
      ))
      .leftJoin(schema.user, eq(schema.productReviews.userId, schema.user.id))
      .where(whereClause)
      .orderBy(desc(schema.productReviews.createdAt))
      .limit(params?.take || 10)
      .offset(params?.skip || 0);

    return reviews.map((review) => ({
      ...review,
      productImage: review.productImage ? this.buildImageUrl(review.productImage) : null,
    }));
  }

  async countReviews(productId?: string, params?: { rating?: number; isApproved?: boolean }) {
    const conditions = [];
    
    if (productId) {
      conditions.push(eq(schema.productReviews.productId, productId));
    }

    if (params?.rating) {
      conditions.push(eq(schema.productReviews.rating, params.rating));
    }

    if (params?.isApproved !== undefined) {
      conditions.push(eq(schema.productReviews.isApproved, params.isApproved));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

  async updateProductRating(productId: string) {
    // Calculate new average rating and review count
    const [result] = await this.db
      .select({
        avgRating: sql<number>`COALESCE(ROUND(AVG(${schema.productReviews.rating}) * 10)::integer, 0)`,
        reviewCount: sql<number>`COUNT(*)::integer`,
      })
      .from(schema.productReviews)
      .where(
        sql`${schema.productReviews.productId} = ${productId} AND ${schema.productReviews.isApproved} = true`
      );

    // Update the product's denormalized rating fields
    await this.db
      .update(schema.products)
      .set({
        averageRating: result.avgRating,
        reviewCount: result.reviewCount,
        updatedAt: new Date(),
      })
      .where(eq(schema.products.id, productId));

    return {
      averageRating: result.avgRating,
      reviewCount: result.reviewCount,
    };
  }

  async getRatingBreakdown(productId: string) {
    const breakdown = await this.db
      .select({
        rating: schema.productReviews.rating,
        count: sql<number>`COUNT(*)::integer`,
      })
      .from(schema.productReviews)
      .where(
        sql`${schema.productReviews.productId} = ${productId} AND ${schema.productReviews.isApproved} = true`
      )
      .groupBy(schema.productReviews.rating)
      .orderBy(sql`${schema.productReviews.rating} DESC`);

    // Initialize breakdown with all ratings (1-5)
    const ratingBreakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    // Fill in actual counts
    for (const item of breakdown) {
      if (item.rating >= 1 && item.rating <= 5) {
        ratingBreakdown[item.rating as keyof typeof ratingBreakdown] = item.count;
      }
    }

    return ratingBreakdown;
  }

  // ============================================================
  // REVIEW REPLIES
  // ============================================================

  async createReply(data: typeof schema.reviewReplies.$inferInsert) {
    const [reply] = await this.db.insert(schema.reviewReplies).values(data).returning();
    return reply;
  }

  async findReplyById(id: string) {
    const [reply] = await this.db
      .select()
      .from(schema.reviewReplies)
      .where(eq(schema.reviewReplies.id, id));

    return reply || null;
  }

  async findRepliesByReviewId(reviewId: string) {
    const replies = await this.db
      .select({
        id: schema.reviewReplies.id,
        reviewId: schema.reviewReplies.reviewId,
        parentId: schema.reviewReplies.parentId,
        userId: schema.reviewReplies.userId,
        comment: schema.reviewReplies.comment,
        isAdminReply: schema.reviewReplies.isAdminReply,
        createdAt: schema.reviewReplies.createdAt,
        updatedAt: schema.reviewReplies.updatedAt,
        userName: schema.user.name,
        userImage: schema.user.image,
        userRole: schema.user.role,
      })
      .from(schema.reviewReplies)
      .leftJoin(schema.user, eq(schema.reviewReplies.userId, schema.user.id))
      .where(eq(schema.reviewReplies.reviewId, reviewId))
      .orderBy(desc(schema.reviewReplies.createdAt));

    return replies;
  }

  async countRepliesByReviewId(reviewId: string) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.reviewReplies)
      .where(eq(schema.reviewReplies.reviewId, reviewId));

    return Number(result.count);
  }

  async deleteReply(id: string) {
    const [reply] = await this.db
      .delete(schema.reviewReplies)
      .where(eq(schema.reviewReplies.id, id))
      .returning();

    return reply;
  }
}
