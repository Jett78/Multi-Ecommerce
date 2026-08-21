import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShippingAddressEntity {
  @ApiProperty({ example: '11111111-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ example: '22222222-0000-0000-0000-000000000002' })
  userId: string;

  @ApiProperty({ enum: ['home', 'office', 'other'], example: 'home' })
  type: string;

  @ApiPropertyOptional({ example: 'Home' })
  label?: string | null;

  @ApiProperty({ example: 3 })
  provinceId: number;

  @ApiProperty({ example: 'Madhesh Province' })
  provinceName: string;

  @ApiProperty({ example: 'Kathmandu' })
  district: string;

  @ApiProperty({ example: 'Kathmandu Metropolitan City' })
  municipality: string;

  @ApiPropertyOptional({ example: 'Near City Mall' })
  landmark?: string | null;

  @ApiProperty({ example: 'Ward 5, Thamel' })
  streetAddress: string;

  @ApiProperty({ example: false })
  isDefault: boolean;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  constructor(partial: Partial<ShippingAddressEntity>) {
    Object.assign(this, partial);
  }
}
