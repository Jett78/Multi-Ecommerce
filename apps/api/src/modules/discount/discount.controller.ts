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
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DiscountService } from './discount.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { ValidateCouponDto } from './dto/validate-coupon.dto';
import { CouponEntity, ValidateCouponResponseEntity } from './entities/coupon.entity';

@ApiTags('Discounts')
@Controller('discounts')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) {}

  @Get()
  @RequirePermissions('discount.read')
  @ApiOperation({ summary: 'List all coupons (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.discountService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Coupons fetched successfully',
      data: result.coupons,
      total: result.totalCount,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get('active')
  @AllowAnonymous()
  @ApiOperation({ summary: 'Get active coupons (public)' })
  async findActive() {
    const coupons = await this.discountService.findActive();
    return {
      success: true,
      statusCode: 200,
      message: 'Active coupons fetched successfully',
      data: coupons,
    };
  }

  @Get(':id')
  @RequirePermissions('discount.read')
  @ApiOperation({ summary: 'Get a coupon by ID (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const coupon = await this.discountService.findById(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Coupon fetched successfully',
      data: coupon,
    };
  }

  @Post()
  @RequirePermissions('discount.create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new coupon (admin)' })
  async create(@Body() dto: CreateCouponDto) {
    const coupon = await this.discountService.create(dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Coupon created successfully',
      data: coupon,
    };
  }

  @Put(':id')
  @RequirePermissions('discount.edit')
  @ApiOperation({ summary: 'Update a coupon (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    const coupon = await this.discountService.update(id, dto);
    return {
      success: true,
      statusCode: 200,
      message: 'Coupon updated successfully',
      data: coupon,
    };
  }

  @Delete(':id')
  @RequirePermissions('discount.delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a coupon (admin)' })
  @ApiParam({ name: 'id', description: 'Coupon ID' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.discountService.delete(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Coupon deleted successfully',
    };
  }

  @Post('validate')
  @AllowAnonymous()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a coupon code at checkout' })
  async validate(@Body() dto: ValidateCouponDto) {
    const result = await this.discountService.validateCoupon(dto);
    return {
      success: true,
      statusCode: 200,
      message: result.message,
      data: result,
    };
  }
}
