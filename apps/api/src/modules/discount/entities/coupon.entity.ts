import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CouponEntity {
  @ApiProperty() id: string;
  @ApiProperty() code: string;
  @ApiProperty() type: string;
  @ApiProperty() value: number;
  @ApiProperty() minOrderAmount: number | null;
  @ApiProperty() maxDiscountAmount: number | null;
  @ApiProperty() usageLimit: number | null;
  @ApiProperty() usageCount: number;
  @ApiProperty() perUserLimit: number | null;
  @ApiProperty() productIds: string[] | null;
  @ApiProperty() categoryIds: string[] | null;
  @ApiProperty() startsAt: Date | null;
  @ApiProperty() expiresAt: Date | null;
  @ApiProperty() isActive: boolean;
  @ApiProperty() description: string | null;
  @ApiProperty() createdAt: Date;
  @ApiProperty() updatedAt: Date;

  constructor(partial: Partial<CouponEntity>) {
    Object.assign(this, partial);
  }
}

export class ValidateCouponResponseEntity {
  @ApiProperty() valid: boolean;
  @ApiProperty() discountAmount: number;
  @ApiProperty() type: string;
  @ApiProperty() code: string;
  @ApiProperty() description: string;
  @ApiProperty() message: string;

  constructor(partial: Partial<ValidateCouponResponseEntity>) {
    Object.assign(this, partial);
  }
}
