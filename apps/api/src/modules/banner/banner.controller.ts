import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { BannerService } from './banner.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';
import { BannerEntity } from './entities/banner.entity';

@ApiTags('banners')
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Post()
  @RequirePermissions('banner.create')
  @ApiOperation({ summary: 'Create a new banner' })
  @ApiResponse({ status: 201, description: 'Banner created successfully', type: BannerEntity })
  async create(@Body() dto: CreateBannerDto) {
    const banner = await this.bannerService.create(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Banner created successfully',
      data: new BannerEntity(banner),
    };
  }

  @AllowAnonymous()
  @Get()
  @ApiOperation({ summary: 'Get all banners' })
  async findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('search') search?: string,
  ) {
    const skipNum = skip ? parseInt(skip, 10) : 0;
    const takeNum = take ? parseInt(take, 10) : 10;
    const result = await this.bannerService.findAll({ skip: skipNum, take: takeNum, search });
    return {
      success: true,
      statusCode: 200,
      message: 'Banners fetched successfully',
      data: result.data.map((b) => new BannerEntity(b)),
      total: result.total,
      skip: skipNum,
      take: takeNum,
      hasMore: skipNum + takeNum < result.total,
    };
  }

  @AllowAnonymous()
  @Get(':id')
  @ApiOperation({ summary: 'Get a banner by ID' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const banner = await this.bannerService.findOne(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Banner fetched successfully',
      data: new BannerEntity(banner),
    };
  }

  @Put(':id')
  @RequirePermissions('banner.edit')
  @ApiOperation({ summary: 'Update a banner' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBannerDto,
  ) {
    const banner = await this.bannerService.update(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Banner updated successfully',
      data: new BannerEntity(banner),
    };
  }

  @Delete(':id')
  @RequirePermissions('banner.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a banner' })
  @ApiParam({ name: 'id', description: 'Banner UUID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    const result = await this.bannerService.remove(id);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
    };
  }
}
