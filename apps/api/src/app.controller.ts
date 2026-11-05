import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AppService } from './app.service';

@ApiTags('health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Redirect to API documentation' })
  @ApiResponse({ status: 302, description: 'Redirects to /api' })
  redirectToApi(@Res() res: Response) {
    return res.redirect('/api');
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Returns health status' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
