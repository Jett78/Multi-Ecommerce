import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsArray, IsIn, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Coupon code (unique)', example: 'SAVE10' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Coupon type', example: 'percentage', enum: ['fixed', 'percentage', 'free_shipping'] })
  @IsString()
  @IsIn(['fixed', 'percentage', 'free_shipping'])
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Discount value', example: 10 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  value?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount in paisa', example: 10000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum discount amount cap in paisa', example: 50000 })
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

  @ApiPropertyOptional({ description: 'Applicable product IDs', type: [String] })
  @IsArray()
  @IsOptional()
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable category IDs', type: [String] })
  @IsArray()
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Applicable brand IDs', type: [String] })
  @IsArray()
  @IsOptional()
  brandIds?: string[];

  @ApiPropertyOptional({ description: 'Filter logic: "and" or "or"', example: 'and', enum: ['and', 'or'] })
  @IsString()
  @IsIn(['and', 'or'])
  @IsOptional()
  filterLogic?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsDateString()
  @IsOptional()
  startsAt?: string;

  @ApiPropertyOptional({ description: 'Expiry date (ISO string)' })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({ description: 'Whether coupon is active' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;
}
