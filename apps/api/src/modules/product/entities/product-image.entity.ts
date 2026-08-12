import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageEntity {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiProperty()
  imageKey: string;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.productId = partial.productId ?? undefined;
    this.variantId = partial.variantId ?? undefined;
    this.imageKey = partial.imageKey;
    this.altText = partial.altText ?? undefined;
    this.sortOrder = partial.sortOrder;
    this.isPrimary = partial.isPrimary;
    this.createdAt = partial.createdAt;
  }
}
