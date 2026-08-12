import { ApiProperty } from '@nestjs/swagger';

export class VariantAttributeEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  attributeName: string;

  @ApiProperty()
  attributeValue: string;

  @ApiProperty()
  sortOrder: number;

  constructor(partial: Partial<VariantAttributeEntity>) {
    Object.assign(this, partial);
  }
}
