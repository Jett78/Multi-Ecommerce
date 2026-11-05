import { Injectable, Inject } from '@nestjs/common';
import { DB_CONNECTION } from '../../db/db.module';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { sql, eq, and, gte } from 'drizzle-orm';

export interface TrackPageViewDto {
  pagePath: string;
  pageTitle?: string;
  referrer?: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

@Injectable()
export class PageViewsService {
  constructor(
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<Record<string, never>>,
  ) {}

  async trackPageView(data: TrackPageViewDto, ipAddress?: string) {
    const deviceType = this.detectDeviceType(data.userAgent);
    const browser = this.detectBrowser(data.userAgent);
    const os = this.detectOS(data.userAgent);

    await this.db.insert(schema.pageViews).values({
      pagePath: data.pagePath,
      pageTitle: data.pageTitle,
      referrer: data.referrer,
      userAgent: data.userAgent,
      ipAddress: ipAddress,
      userId: data.userId,
      sessionId: data.sessionId,
      deviceType,
      browser,
      os,
    });

    return { success: true };
  }

  async getPageViewsAnalytics(period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const intervalMap = {
      '7d': { interval: '7 days', truncate: 'day' },
      '30d': { interval: '30 days', truncate: 'day' },
      '90d': { interval: '90 days', truncate: 'week' },
      '1y': { interval: '1 year', truncate: 'month' },
    };

    const { interval, truncate } = intervalMap[period];

    const results = await this.db
      .select({
        date: sql<string>`DATE_TRUNC('${sql.raw(truncate)}', ${schema.pageViews.createdAt})`,
        views: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(DISTINCT ${schema.pageViews.sessionId})`,
      })
      .from(schema.pageViews)
      .where(gte(schema.pageViews.createdAt, sql`NOW() - INTERVAL '${sql.raw(interval)}'`))
      .groupBy(sql`DATE_TRUNC('${sql.raw(truncate)}', ${schema.pageViews.createdAt})`)
      .orderBy(sql`DATE_TRUNC('${sql.raw(truncate)}', ${schema.pageViews.createdAt})`);

    return results.map((row) => ({
      date: row.date,
      views: Number(row.views),
      uniqueVisitors: Number(row.uniqueVisitors),
    }));
  }

  async getTopPages(limit: number = 10, period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const intervalMap = {
      '7d': '7 days',
      '30d': '30 days',
      '90d': '90 days',
      '1y': '1 year',
    };

    const interval = intervalMap[period];

    const results = await this.db
      .select({
        pagePath: schema.pageViews.pagePath,
        pageTitle: schema.pageViews.pageTitle,
        views: sql<number>`count(*)`,
        uniqueVisitors: sql<number>`count(DISTINCT ${schema.pageViews.sessionId})`,
      })
      .from(schema.pageViews)
      .where(gte(schema.pageViews.createdAt, sql`NOW() - INTERVAL '${sql.raw(interval)}'`))
      .groupBy(schema.pageViews.pagePath, schema.pageViews.pageTitle)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);

    return results.map((row) => ({
      pagePath: row.pagePath,
      pageTitle: row.pageTitle || row.pagePath,
      views: Number(row.views),
      uniqueVisitors: Number(row.uniqueVisitors),
    }));
  }

  async getPageViewsStats() {
    const [totalViews] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pageViews);

    const [todayViews] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pageViews)
      .where(
        and(
          gte(schema.pageViews.createdAt, sql`CURRENT_DATE`),
          sql`${schema.pageViews.createdAt} < CURRENT_DATE + INTERVAL '1 day'`
        )
      );

    const [last7Days] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(schema.pageViews)
      .where(gte(schema.pageViews.createdAt, sql`NOW() - INTERVAL '7 days'`));

    return {
      totalViews: Number(totalViews.count),
      todayViews: Number(todayViews.count),
      last7DaysViews: Number(last7Days.count),
    };
  }

  private detectDeviceType(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'tablet';
    }
    return 'desktop';
  }

  private detectBrowser(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('firefox')) return 'Firefox';
    if (ua.includes('chrome')) return 'Chrome';
    if (ua.includes('safari')) return 'Safari';
    if (ua.includes('edge')) return 'Edge';
    if (ua.includes('opera')) return 'Opera';
    return 'unknown';
  }

  private detectOS(userAgent?: string): string {
    if (!userAgent) return 'unknown';
    const ua = userAgent.toLowerCase();
    if (ua.includes('windows')) return 'Windows';
    if (ua.includes('mac')) return 'macOS';
    if (ua.includes('linux')) return 'Linux';
    if (ua.includes('android')) return 'Android';
    if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) return 'iOS';
    return 'unknown';
  }
}
