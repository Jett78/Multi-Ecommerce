import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsIn, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCouponDto {
  @ApiProperty({ description: 'Coupon code (unique)', example: 'SAVE10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Coupon type', example: 'percentage', enum: ['fixed', 'percentage', 'free_shipping'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['fixed', 'percentage', 'free_shipping'])
  type: string;

  @ApiProperty({ description: 'Discount value (fixed: amount in paisa, percentage: 0-100)', example: 10 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ description: 'Minimum order amount in paisa', example: 10000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount cap in paisa (for percentage type)', example: 50000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Total usage limit', example: 100 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Max uses per user', example: 1 })
  @IsNumber()
  @Min(1)
  @IsOptional()
  perUserLimit?: number;

  @ApiPropertyOptional({ description: 'Applicable product IDs (null = all products)', type: [String] })
  @IsArray()
  @IsOptional()
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable category IDs (null = all categories)', type: [String] })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable brand IDs (null = all brands)', type: [String] })
  @IsArray()
  @IsOptional()
  brandIds?: string[];

  @ApiPropertyOptional({ description: 'Filter logic: "and" (must match all filters) or "or" (match any filter)', example: 'and', enum: ['and', 'or'], default: 'and' })
  @IsString()
  @IsIn(['and', 'or'])
  @IsOptional()
  filterLogic?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO string)', example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO string)', example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Whether coupon is active', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Description of the coupon', example: '10% off on orders above Rs. 1000' })
  @IsString()
  @IsOptional()
  description?: string;
}
