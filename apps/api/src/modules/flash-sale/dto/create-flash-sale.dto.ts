import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber, Min, MaxLength, MinLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class FlashSaleProductDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsString()
  variantId: string;

  @ApiProperty({ description: 'Sale price in base currency unit', example: 999 })
  @IsNumber()
  @Min(0)
  salePrice: number;

  @ApiProperty({ description: 'Original price snapshot', example: 1499 })
  @IsNumber()
  @Min(0)
  originalPrice: number;

  @ApiPropertyOptional({ description: 'Max quantity available in this sale' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;
}

export class CreateFlashSaleDto {
  @ApiProperty({ example: 'Mega Flash Sale' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'mega-flash-sale' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  slug: string;

  @ApiPropertyOptional({ example: 'Up to 50% off on selected items!' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2026-09-05T00:00:00.000Z' })
  @IsDateString()
  startsAt: string;

  @ApiProperty({ example: '2026-09-07T23:59:59.000Z' })
  @IsDateString()
  endsAt: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'banners/flash-sale.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ type: [FlashSaleProductDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FlashSaleProductDto)
  products?: FlashSaleProductDto[];
}
