import { Inject, Injectable } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { eq, sql, desc, and, count } from 'drizzle-orm';

@Injectable()
export class OrderRepository {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createOrder(data: {
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
    notes?: string;
    metadata?: string;
  }) {
    const [order] = await this.db
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
        notes: data.notes,
        metadata: data.metadata,
      })
      .returning();

    return order;
  }

  async createOrderItem(data: {
    orderId: string;
    variantId: string;
    productName: string;
    variantName?: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    sku?: string;
  }) {
    const [item] = await this.db
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

  async findOrderItems(orderId: string) {
    const items = await this.db
      .select()
      .from(schema.orderItems)
      .innerJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .where(eq(schema.orderItems.orderId, orderId));

    return items.map((row) => ({
      id: row.order_items.id,
      orderId: row.order_items.orderId,
      variantId: row.order_items.variantId,
      productName: row.order_items.productName,
      variantName: row.order_items.variantName,
      quantity: row.order_items.quantity,
      unitPrice: row.order_items.unitPrice,
      totalAmount: row.order_items.totalAmount,
      sku: row.order_items.sku,
      product: {
        id: row.products.id,
        name: row.products.name,
        slug: row.products.slug,
      },
      variant: {
        id: row.product_variants.id,
        sku: row.product_variants.sku,
      },
    }));
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

    const orders = await this.db
      .select()
      .from(schema.orders)
      .where(whereClause)
      .orderBy(desc(schema.orders.createdAt))
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
