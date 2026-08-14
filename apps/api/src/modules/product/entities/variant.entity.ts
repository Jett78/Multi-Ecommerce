import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VariantAttributeEntity } from './variant-attribute.entity';
import { ProductImageEntity } from './product-image.entity';

export class VariantEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiProperty()
  sku: string;

  @ApiProperty()
  price: number;

  @ApiPropertyOptional()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  costPrice?: number;

  @ApiProperty()
  stockQuantity: number;

  @ApiProperty()
  allowBackorder: boolean;

  @ApiProperty()
  lowStockThreshold: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [VariantAttributeEntity] })
  attributes?: VariantAttributeEntity[];

  @ApiPropertyOptional({ type: [ProductImageEntity] })
  images?: ProductImageEntity[];

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.productId = partial.productId;
    this.sku = partial.sku;
    this.price = partial.price;
    this.compareAtPrice = partial.compareAtPrice ?? undefined;
    this.costPrice = partial.costPrice ?? undefined;
    this.stockQuantity = partial.stockQuantity;
    this.allowBackorder = partial.allowBackorder;
    this.lowStockThreshold = partial.lowStockThreshold ?? 5;
    this.weight = partial.weight ?? undefined;
    this.barcode = partial.barcode ?? undefined;
    this.isActive = partial.isActive;
    this.sortOrder = partial.sortOrder;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;

    if (partial.attributes) {
      this.attributes = partial.attributes.map((a: Record<string, any>) => new VariantAttributeEntity(a));
    }
    if (partial.images) {
      this.images = partial.images.map((i: Record<string, any>) => new ProductImageEntity(i));
    }
  }
}
