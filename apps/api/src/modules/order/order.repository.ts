import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, sql, desc, asc, and, count, inArray, or } from 'drizzle-orm';

@Injectable()
export class OrderRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createOrder(
    data: {
      orderId: string;
      userId: string;
      subtotal: number;
      discountAmount?: number;
      taxAmount?: number;
      totalAmount: number;
      currency?: string;
      status?: string;
      paymentMethod?: string;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      shippingAddress?: string;
      billingAddress?: string;
      landmark?: string;
      notes?: string;
      metadata?: string;
      couponId?: string;
    },
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const [order] = await db
      .insert(schema.orders)
      .values({
        orderId: data.orderId,
        userId: data.userId,
        subtotal: data.subtotal,
        discountAmount: data.discountAmount ?? 0,
        taxAmount: data.taxAmount ?? 0,
        totalAmount: data.totalAmount,
        currency: data.currency ?? 'NPR',
        status: (data.status as any) ?? 'pending',
        paymentMethod: (data.paymentMethod as any) ?? null,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        billingAddress: data.billingAddress,
        landmark: data.landmark,
        notes: data.notes,
        metadata: data.metadata,
        couponId: data.couponId ?? null,
      })
      .returning();

    return order;
  }

  async createOrderItem(
    data: {
      orderId: string;
      variantId: string;
      productName: string;
      variantName?: string;
      quantity: number;
      unitPrice: number;
      totalAmount: number;
      sku?: string;
    },
    tx?: NodePgDatabase<typeof schema>,
  ) {
    const db = tx ?? this.db;
    const [item] = await db
      .insert(schema.orderItems)
      .values({
        orderId: data.orderId,
        variantId: data.variantId,
        productName: data.productName,
        variantName: data.variantName,
        quantity: data.quantity,
        unitPrice: data.unitPrice,
        subtotal: data.totalAmount,
        totalAmount: data.totalAmount,
        sku: data.sku,
      })
      .returning();

    return item;
  }

  async findOrderById(id: string) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id));

    return order || null;
  }

  async findOrderByOrderId(orderId: string) {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.orderId, orderId));

    return order || null;
  }

  async findOrderCoupons(orderId: string) {
    const records = await this.db
      .select()
      .from(schema.orderCoupons)
      .where(eq(schema.orderCoupons.orderId, orderId));

    return records;
  }

  async findOrderItems(orderId: string, tx?: NodePgDatabase<typeof schema>) {
    const db = tx ?? this.db;
    const rows = await db
      .select({
        item: schema.orderItems,
        product: {
          id: schema.products.id,
          name: schema.products.name,
          slug: schema.products.slug,
        },
        variant: {
          id: schema.productVariants.id,
          sku: schema.productVariants.sku,
        },
      })
      .from(schema.orderItems)
      .innerJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.orderItems.orderId, orderId));

    const variantIds = rows.map((r) => r.variant.id);
    const productIds = rows.map((r) => r.product.id);

    const attributes = variantIds.length
      ? await db
          .select()
          .from(schema.variantAttributes)
          .where(inArray(schema.variantAttributes.variantId, variantIds))
          .orderBy(schema.variantAttributes.sortOrder)
      : [];

    const images = variantIds.length || productIds.length
      ? await db
          .select()
          .from(schema.productImages)
          .where(
            or(
              inArray(schema.productImages.variantId, variantIds),
              inArray(schema.productImages.productId, productIds),
            ),
          )
          .orderBy(schema.productImages.sortOrder)
      : [];

    const attributesByVariant = new Map<string, typeof attributes>();
    for (const attr of attributes) {
      const list = attributesByVariant.get(attr.variantId) || [];
      list.push(attr);
      attributesByVariant.set(attr.variantId, list);
    }

    const imagesByVariant = new Map<string, typeof images>();
    const imagesByProduct = new Map<string, typeof images>();
    for (const img of images) {
      if (img.variantId) {
        const list = imagesByVariant.get(img.variantId) || [];
        list.push(img);
        imagesByVariant.set(img.variantId, list);
      }
      if (img.productId) {
        const list = imagesByProduct.get(img.productId) || [];
        list.push(img);
        imagesByProduct.set(img.productId, list);
      }
    }

    return rows.map((row) => {
      const variantImages = imagesByVariant.get(row.variant.id) || [];
      let imageRow =
        variantImages.find((i) => i.isPrimary) ||
        variantImages[0] ||
        (imagesByProduct.get(row.product.id) || []).find((i) => i.isPrimary) ||
        (imagesByProduct.get(row.product.id) || [])[0] ||
        null;

      const imageKey = imageRow?.imageKey || null;

      return {
        id: row.item.id,
        orderId: row.item.orderId,
        variantId: row.item.variantId,
        productName: row.item.productName,
        variantName: row.item.variantName,
        quantity: row.item.quantity,
        unitPrice: row.item.unitPrice,
        totalAmount: row.item.totalAmount,
        sku: row.item.sku,
        image: imageKey ? this.buildImageUrl(imageKey) : null,
        attributes: (attributesByVariant.get(row.variant.id) || []).map((a) => ({
          attributeName: a.attributeName,
          attributeValue: a.attributeValue,
        })),
        product: {
          id: row.product.id,
          name: row.product.name,
          slug: row.product.slug,
        },
        variant: {
          id: row.variant.id,
          sku: row.variant.sku,
        },
      };
    });
  }

  private buildImageUrl(key: string): string {
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL || '';
    const bucketName = process.env.S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-south-1';

    if (cloudfrontUrl) {
      return `https://${cloudfrontUrl}/${key}`;
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }

  async deleteOrder(id: string) {
    await this.db.delete(schema.orderItems).where(eq(schema.orderItems.orderId, id));
    const [deleted] = await this.db
      .delete(schema.orders)
      .where(eq(schema.orders.id, id))
      .returning();
    return deleted;
  }

  async findOrdersByUserId(userId: string, page: number = 1, limit: number = 10) {
    const offset = (page - 1) * limit;

    const orders = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId))
      .orderBy(desc(schema.orders.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(schema.orders)
      .where(eq(schema.orders.userId, userId));

    return {
      orders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async findAllOrders(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    sort?: string;
  }) {
    const offset = (page - 1) * limit;
    const conditions: any[] = [];

    if (filters?.status) {
      conditions.push(eq(schema.orders.status, filters.status as any));
    }
    if (filters?.paymentMethod) {
      conditions.push(eq(schema.orders.paymentMethod, filters.paymentMethod as any));
    }
    if (filters?.paymentStatus) {
      conditions.push(eq(schema.orders.paymentStatus, filters.paymentStatus as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      filters?.sort === 'asc'
        ? asc(schema.orders.createdAt)
        : desc(schema.orders.createdAt);

    const orders = await this.db
      .select()
      .from(schema.orders)
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const [{ totalCount }] = await this.db
      .select({ totalCount: count() })
      .from(schema.orders)
      .where(whereClause);

    return {
      orders,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    };
  }

  async updateOrderStatus(id: string, status: string) {
    const [updated] = await this.db
      .update(schema.orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(schema.orders.id, id))
      .returning();

    return updated;
  }

  async updatePaymentStatus(id: string, paymentStatus: string, transactionId?: string) {
    const updateData: any = { paymentStatus: paymentStatus as any, updatedAt: new Date() };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    const [updated] = await this.db
      .update(schema.orders)
      .set(updateData)
      .where(eq(schema.orders.id, id))
      .returning();

    return updated;
  }

  async getOrderStats() {
    const [stats] = await this.db
      .select({
        totalOrders: count(),
        totalRevenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)`,
      })
      .from(schema.orders)
      .where(eq(schema.orders.paymentStatus, 'completed'));

    const [pendingCount] = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'pending'));

    const [confirmedCount] = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'confirmed'));

    const [shippedCount] = await this.db
      .select({ count: count() })
      .from(schema.orders)
      .where(eq(schema.orders.status, 'shipped'));

    return {
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      pendingOrders: pendingCount.count,
      confirmedOrders: confirmedCount.count,
      shippedOrders: shippedCount.count,
    };
  }
}
