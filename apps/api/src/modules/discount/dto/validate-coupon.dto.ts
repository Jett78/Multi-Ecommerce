import { IsString, IsNotEmpty, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ValidateCouponItemDto {
  @ApiProperty({ description: 'Product variant ID' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price in paisa' })
  @IsNumber()
  @Min(0)
  priceAtAdd: number;

  @ApiProperty({ description: 'Product ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Category ID' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate', example: 'SAVE10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Cart subtotal in paisa', example: 50000 })
  @IsNumber()
  @Min(0)
  subtotal: number;

  @ApiProperty({ description: 'Cart items', type: [ValidateCouponItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValidateCouponItemDto)
  items: ValidateCouponItemDto[];
}
