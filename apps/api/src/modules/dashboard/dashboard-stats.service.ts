import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { sql, eq, and, gte, lt } from 'drizzle-orm';

@Injectable()
export class DashboardStatsService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<Record<string, never>>,
  ) {}

  async getStats() {
    const [
      totalRevenue,
      totalOrders,
      pendingOrders,
      activeProducts,
      totalCustomers,
      lowStockProducts,
      recentOrders,
      todayOrders,
      todayRevenue,
      webStats,
      posStats,
    ] = await Promise.all([
      this.db
        .select({ revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)` })
        .from(schema.orders)
        .where(eq(schema.orders.paymentStatus, 'completed'))
        .then((result) => Number(result[0].revenue)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .then((result) => Number(result[0].count)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(eq(schema.orders.status, 'pending'))
        .then((result) => Number(result[0].count)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(eq(schema.products.status, 'active'))
        .then((result) => Number(result[0].count)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.user)
        .where(eq(schema.user.role, 'customer'))
        .then((result) => Number(result[0].count)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.products)
        .where(
          and(
            eq(schema.products.status, 'active'),
            sql`${schema.products.stockQuantity} < ${schema.products.lowStockThreshold}`
          )
        )
        .then((result) => Number(result[0].count)),
      
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(gte(schema.orders.createdAt, sql`NOW() - INTERVAL '7 days'`))
        .then((result) => Number(result[0].count)),

      this.db
        .select({ count: sql<number>`count(*)` })
        .from(schema.orders)
        .where(
          and(
            gte(schema.orders.createdAt, sql`CURRENT_DATE`),
            lt(schema.orders.createdAt, sql`CURRENT_DATE + INTERVAL '1 day'`)
          )
        )
        .then((result) => Number(result[0].count)),

      this.db
        .select({ revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)` })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.paymentStatus, 'completed'),
            gte(schema.orders.createdAt, sql`CURRENT_DATE`),
            lt(schema.orders.createdAt, sql`CURRENT_DATE + INTERVAL '1 day'`)
          )
        )
        .then((result) => Number(result[0].revenue)),

      this.db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)`,
        })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.paymentStatus, 'completed'),
            eq(schema.orders.source, 'web')
          )
        )
        .then((result) => ({
          count: Number(result[0].count),
          revenue: Number(result[0].revenue),
        })),

      this.db
        .select({
          count: sql<number>`count(*)`,
          revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)`,
        })
        .from(schema.orders)
        .where(
          and(
            eq(schema.orders.paymentStatus, 'completed'),
            eq(schema.orders.source, 'pos')
          )
        )
        .then((result) => ({
          count: Number(result[0].count),
          revenue: Number(result[0].revenue),
        })),
    ]);

    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      activeProducts,
      totalCustomers,
      lowStockProducts,
      recentOrders,
      todayOrders,
      todayRevenue,
      webOrders: webStats.count,
      webRevenue: webStats.revenue,
      posOrders: posStats.count,
      posRevenue: posStats.revenue,
      averageOrderValue,
    };
  }

  async getAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const intervalMap = {
      '7d': { interval: '7 days', truncate: 'day' },
      '30d': { interval: '30 days', truncate: 'day' },
      '90d': { interval: '90 days', truncate: 'week' },
      '1y': { interval: '1 year', truncate: 'month' },
    };

    const { interval, truncate } = intervalMap[period];

    const results = await this.db
      .select({
        date: sql<string>`DATE_TRUNC('${sql.raw(truncate)}', ${schema.orders.createdAt})`,
        revenue: sql<number>`coalesce(sum(CASE WHEN ${schema.orders.paymentStatus} = 'completed' THEN ${schema.orders.totalAmount} ELSE 0 END), 0)`,
        orders: sql<number>`count(*)`,
        customers: sql<number>`count(DISTINCT ${schema.orders.userId})`,
      })
      .from(schema.orders)
      .where(gte(schema.orders.createdAt, sql`NOW() - INTERVAL '${sql.raw(interval)}'`))
      .groupBy(sql`DATE_TRUNC('${sql.raw(truncate)}', ${schema.orders.createdAt})`)
      .orderBy(sql`DATE_TRUNC('${sql.raw(truncate)}', ${schema.orders.createdAt})`);

    return results.map((row) => ({
      date: row.date,
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      customers: Number(row.customers),
    }));
  }

  async getSalesChannelAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const intervalMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year',
    };

    const interval = intervalMap[period];

    const results = await this.db
      .select({
        source: schema.orders.source,
        revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)`,
        orders: sql<number>`count(*)`,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.paymentStatus, 'completed'),
          gte(schema.orders.createdAt, sql`NOW() - INTERVAL '${sql.raw(interval)}'`)
        )
      )
      .groupBy(schema.orders.source);

    return results.map((row) => ({
      source: row.source || 'unknown',
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  }

  async getPaymentMethodAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const intervalMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year',
    };

    const interval = intervalMap[period];

    const results = await this.db
      .select({
        paymentMethod: schema.orders.paymentMethod,
        revenue: sql<number>`coalesce(sum(${schema.orders.totalAmount}), 0)`,
        orders: sql<number>`count(*)`,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.paymentStatus, 'completed'),
          gte(schema.orders.createdAt, sql`NOW() - INTERVAL '${sql.raw(interval)}'`)
        )
      )
      .groupBy(schema.orders.paymentMethod);

    return results.map((row) => ({
      paymentMethod: row.paymentMethod || 'unknown',
      revenue: Number(row.revenue),
      orders: Number(row.orders),
    }));
  }

  async getCategoryAnalytics(limit: number = 10) {
    const results = await this.db
      .select({
        categoryId: schema.products.categoryId,
        categoryName: schema.categories.name,
        revenue: sql<number>`coalesce(sum(${schema.orderItems.totalAmount}), 0)`,
        orders: sql<number>`count(DISTINCT ${schema.orderItems.orderId})`,
        productsSold: sql<number>`sum(${schema.orderItems.quantity})`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .innerJoin(schema.productVariants, eq(schema.orderItems.variantId, schema.productVariants.id))
      .innerJoin(schema.products, eq(schema.productVariants.productId, schema.products.id))
      .leftJoin(schema.categories, eq(schema.products.categoryId, schema.categories.id))
      .where(eq(schema.orders.paymentStatus, 'completed'))
      .groupBy(schema.products.categoryId, schema.categories.name)
      .orderBy(sql`sum(${schema.orderItems.totalAmount}) DESC`)
      .limit(limit);

    return results.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName || 'Uncategorized',
      revenue: Number(row.revenue),
      orders: Number(row.orders),
      productsSold: Number(row.productsSold),
    }));
  }

  async getTopProducts(limit: number = 5) {
    const results = await this.db
      .select({
        productId: schema.orderItems.variantId,
        productName: schema.orderItems.productName,
        totalQuantity: sql<number>`sum(${schema.orderItems.quantity})`,
        totalRevenue: sql<number>`sum(${schema.orderItems.totalAmount})`,
      })
      .from(schema.orderItems)
      .innerJoin(schema.orders, eq(schema.orderItems.orderId, schema.orders.id))
      .where(eq(schema.orders.paymentStatus, 'completed'))
      .groupBy(schema.orderItems.variantId, schema.orderItems.productName)
      .orderBy(sql`sum(${schema.orderItems.totalAmount}) DESC`)
      .limit(limit);

    return results.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
    }));
  }

  async getRecentOrders(limit: number = 10) {
    const results = await this.db
      .select({
        id: schema.orders.id,
        orderId: schema.orders.orderId,
        customerName: schema.orders.customerName,
        totalAmount: schema.orders.totalAmount,
        status: schema.orders.status,
        paymentStatus: schema.orders.paymentStatus,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .orderBy(sql`${schema.orders.createdAt} DESC`)
      .limit(limit);

    return results;
  }
}