import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DeliveryRateEntity {
  @ApiProperty() provider: string;
  @ApiProperty() basePrice: number;
  @ApiProperty() discount: number;
  @ApiProperty() finalPrice: number;
  @ApiProperty() codEnabled: boolean;
  @ApiProperty() codPercentage: number;
  @ApiProperty() estimatedDays: number;

  constructor(partial: Record<string, any>) {
    Object.assign(this, partial);
  }
}

export class DistrictMappingEntity {
  @ApiProperty() id: string;
  @ApiProperty() district: string;
  @ApiProperty() provinceId: number;
  @ApiProperty() provider: string;
  @ApiProperty() courierCityId: number | null;
  @ApiProperty() courierCityName: string | null;
  @ApiProperty() courierAreaId: number | null;
  @ApiProperty() courierAreaName: string | null;
  @ApiProperty() courierBranch: string | null;
  @ApiProperty() deliveryChargeOverrides: Array<{ weightKg: number; price: number }> | null;
  @ApiProperty() isMapped: boolean;

  constructor(partial: Record<string, any>) {
    Object.assign(this, partial);
  }
}
