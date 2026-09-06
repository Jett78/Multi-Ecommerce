import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddFlashSaleProductDto {
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
