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

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.variantId = partial.variantId;
    this.attributeName = partial.attributeName;
    this.attributeValue = partial.attributeValue;
    this.sortOrder = partial.sortOrder;
  }
}
