import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Roles } from '@thallesp/nestjs-better-auth';
import { DashboardStatsService } from './dashboard-stats.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardStatsController {
  constructor(private readonly dashboardStatsService: DashboardStatsService) {}

  @Get('stats')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats fetched successfully' })
  async getStats() {
    const stats = await this.dashboardStatsService.getStats();
    return {
      success: true,
      statusCode: 200,
      message: 'Dashboard stats fetched successfully',
      data: stats,
    };
  }

  @Get('analytics')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get analytics time-series data' })
  @ApiResponse({ status: 200, description: 'Analytics data fetched successfully' })
  async getAnalytics(@Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const analytics = await this.dashboardStatsService.getAnalytics(period);
    return {
      success: true,
      statusCode: 200,
      message: 'Analytics data fetched successfully',
      data: analytics,
    };
  }

  @Get('sales-channel')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get sales channel analytics (Web vs POS)' })
  @ApiResponse({ status: 200, description: 'Sales channel data fetched successfully' })
  async getSalesChannelAnalytics(@Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const channelData = await this.dashboardStatsService.getSalesChannelAnalytics(period);
    return {
      success: true,
      statusCode: 200,
      message: 'Sales channel data fetched successfully',
      data: channelData,
    };
  }

  @Get('payment-methods')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get payment method analytics' })
  @ApiResponse({ status: 200, description: 'Payment method data fetched successfully' })
  async getPaymentMethodAnalytics(@Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const paymentData = await this.dashboardStatsService.getPaymentMethodAnalytics(period);
    return {
      success: true,
      statusCode: 200,
      message: 'Payment method data fetched successfully',
      data: paymentData,
    };
  }

  @Get('category-performance')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get category performance analytics' })
  @ApiResponse({ status: 200, description: 'Category performance data fetched successfully' })
  async getCategoryAnalytics(@Query('limit') limit?: string) {
    const categoryData = await this.dashboardStatsService.getCategoryAnalytics(
      limit ? parseInt(limit, 10) : 10
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Category performance data fetched successfully',
      data: categoryData,
    };
  }

  @Get('top-products')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiResponse({ status: 200, description: 'Top products fetched successfully' })
  async getTopProducts(@Query('limit') limit?: string) {
    const topProducts = await this.dashboardStatsService.getTopProducts(
      limit ? parseInt(limit, 10) : 5
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Top products fetched successfully',
      data: topProducts,
    };
  }

  @Get('recent-orders')
  @Roles(['super_admin', 'admin'])
  @ApiOperation({ summary: 'Get recent orders' })
  @ApiResponse({ status: 200, description: 'Recent orders fetched successfully' })
  async getRecentOrders(@Query('limit') limit?: string) {
    const recentOrders = await this.dashboardStatsService.getRecentOrders(
      limit ? parseInt(limit, 10) : 10
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Recent orders fetched successfully',
      data: recentOrders,
    };
  }
}