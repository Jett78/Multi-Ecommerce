import { IsString, IsNotEmpty, IsOptional, IsEmail, IsArray, ValidateNested, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({ description: 'Product variant ID', example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @ApiProperty({ description: 'Quantity to order', example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Unit price captured at the time of adding to cart', example: 1299 })
  @IsNumber()
  @Min(0)
  priceAtAdd: number;
}

export class CreateOrderDto {
  @ApiProperty({
    description: 'List of items in the cart',
    type: CreateOrderItemDto,
    isArray: true,
    example: [
      { variantId: 'a1b2c3d4-0000-0000-0000-000000000001', quantity: 2, priceAtAdd: 1299 },
      { variantId: 'a1b2c3d4-0000-0000-0000-000000000002', quantity: 1, priceAtAdd: 499 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @ApiProperty({ description: 'Payment method', example: 'cod', enum: ['cod', 'khalti', 'stripe'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['cod', 'khalti', 'stripe'])
  paymentMethod: string;

  @ApiProperty({ description: "Customer's full name", example: 'Ram Sharma' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ description: "Customer's email address", example: 'ram.sharma@example.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiPropertyOptional({ description: "Customer's phone number", example: '+977 9800000000' })
  @IsString()
  @IsOptional()
  customerPhone?: string;

  @ApiProperty({
    description: 'Shipping address',
    example: 'Baluwatar, Kathmandu, Province 3, Nepal',
  })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiPropertyOptional({ description: 'Billing address (defaults to shipping address)', example: 'Baluwatar, Kathmandu, Nepal' })
  @IsString()
  @IsOptional()
  billingAddress?: string;

  @ApiPropertyOptional({ description: 'Nearby landmark', example: 'Next to City Mall' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({ description: 'Additional notes for the order', example: 'Please deliver after 5 PM' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Coupon code to apply', example: 'SAVE10' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ description: 'Delivery charge in paisa', example: 30000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  deliveryCharge?: number;

  @ApiPropertyOptional({ description: 'Courier provider used', example: 'pathao' })
  @IsString()
  @IsOptional()
  courierProvider?: string;

  @ApiPropertyOptional({ description: 'Estimated delivery days', example: 3 })
  @IsNumber()
  @IsOptional()
  estimatedDeliveryDays?: number;

  @ApiPropertyOptional({ description: 'Shipping district (used for courier shipment)', example: 'Kathmandu' })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Parcel weight in kilograms (used for courier shipment)', example: 1.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  parcelWeightKg?: number;

  @ApiPropertyOptional({ description: 'Courier delivery type', example: 'normal' })
  @IsString()
  @IsOptional()
  deliveryType?: string;
}
