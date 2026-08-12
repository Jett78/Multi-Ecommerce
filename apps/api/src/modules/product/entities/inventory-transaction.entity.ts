import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryTransactionEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  variantId: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  quantity: number;

  @ApiProperty()
  quantityBefore: number;

  @ApiProperty()
  quantityAfter: number;

  @ApiPropertyOptional()
  reference?: string;

  @ApiPropertyOptional()
  notes?: string;

  @ApiPropertyOptional()
  createdBy?: string;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.variantId = partial.variantId;
    this.type = partial.type;
    this.quantity = partial.quantity;
    this.quantityBefore = partial.quantityBefore;
    this.quantityAfter = partial.quantityAfter;
    this.reference = partial.reference ?? undefined;
    this.notes = partial.notes ?? undefined;
    this.createdBy = partial.createdBy ?? undefined;
    this.createdAt = partial.createdAt;
  }
}
