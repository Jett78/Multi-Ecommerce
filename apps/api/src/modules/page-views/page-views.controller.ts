import { Controller, Post, Get, Body, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PageViewsService } from './page-views.service';
import { Request } from 'express';

@ApiTags('page-views')
@Controller('page-views')
export class PageViewsController {
  constructor(private readonly pageViewsService: PageViewsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track a page view' })
  @ApiResponse({ status: 201, description: 'Page view tracked successfully' })
  async trackPageView(@Body() body: any, @Req() req: Request) {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] as string || req.socket.remoteAddress;
    
    await this.pageViewsService.trackPageView({
      pagePath: body.pagePath,
      pageTitle: body.pageTitle,
      referrer: body.referrer,
      userAgent: req.headers['user-agent'],
      userId: body.userId,
      sessionId: body.sessionId,
    }, ipAddress);

    return {
      success: true,
      statusCode: 201,
      message: 'Page view tracked successfully',
    };
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get page views analytics' })
  @ApiResponse({ status: 200, description: 'Page views analytics fetched successfully' })
  async getAnalytics(@Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d') {
    const analytics = await this.pageViewsService.getPageViewsAnalytics(period);
    return {
      success: true,
      statusCode: 200,
      message: 'Page views analytics fetched successfully',
      data: analytics,
    };
  }

  @Get('top-pages')
  @ApiOperation({ summary: 'Get top pages by views' })
  @ApiResponse({ status: 200, description: 'Top pages fetched successfully' })
  async getTopPages(
    @Query('limit') limit?: string,
    @Query('period') period: '7d' | '30d' | '90d' | '1y' = '30d'
  ) {
    const topPages = await this.pageViewsService.getTopPages(
      limit ? parseInt(limit, 10) : 10,
      period
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Top pages fetched successfully',
      data: topPages,
    };
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get page views stats' })
  @ApiResponse({ status: 200, description: 'Page views stats fetched successfully' })
  async getStats() {
    const stats = await this.pageViewsService.getPageViewsStats();
    return {
      success: true,
      statusCode: 200,
      message: 'Page views stats fetched successfully',
      data: stats,
    };
  }
}
