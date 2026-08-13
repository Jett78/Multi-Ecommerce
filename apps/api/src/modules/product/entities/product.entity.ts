import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VariantEntity } from './variant.entity';
import { ProductImageEntity } from './product-image.entity';
import { SeoMetaEntity } from '../../blog/entities/seo-meta.entity';

export class ProductEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  shortDescription?: string;

  @ApiPropertyOptional()
  categoryId?: string;

  @ApiPropertyOptional()
  subcategoryId?: string;

  @ApiPropertyOptional()
  brandId?: string;

  @ApiPropertyOptional()
  sku?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isFeatured: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional()
  tags?: string[];

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  price?: number;

  @ApiPropertyOptional()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  costPrice?: number;

  @ApiPropertyOptional()
  stockQuantity?: number;

  @ApiPropertyOptional()
  allowBackorder?: boolean;

  @ApiPropertyOptional()
  lowStockThreshold?: number;

  @ApiPropertyOptional()
  weight?: number;

  @ApiPropertyOptional()
  barcode?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  category?: { id: string; name: string; slug: string };

  @ApiPropertyOptional()
  subcategory?: { id: string; name: string; slug: string };

  @ApiPropertyOptional()
  brand?: { id: string; name: string };

  @ApiPropertyOptional({ type: SeoMetaEntity })
  seoMeta?: SeoMetaEntity;

  @ApiPropertyOptional({ type: [VariantEntity] })
  variants?: VariantEntity[];

  @ApiPropertyOptional({ type: [ProductImageEntity] })
  images?: ProductImageEntity[];

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.name = partial.name;
    this.slug = partial.slug;
    this.description = partial.description ?? undefined;
    this.shortDescription = partial.shortDescription ?? undefined;
    this.categoryId = partial.categoryId ?? undefined;
    this.subcategoryId = partial.subcategoryId ?? undefined;
    this.brandId = partial.brandId ?? undefined;
    this.sku = partial.sku ?? undefined;
    this.status = partial.status;
    this.isFeatured = partial.isFeatured;
    this.sortOrder = partial.sortOrder;
    this.tags = partial.tags ?? undefined;
    this.isActive = partial.isActive;
    this.price = partial.price ?? undefined;
    this.compareAtPrice = partial.compareAtPrice ?? undefined;
    this.costPrice = partial.costPrice ?? undefined;
    this.stockQuantity = partial.stockQuantity ?? undefined;
    this.allowBackorder = partial.allowBackorder ?? undefined;
    this.lowStockThreshold = partial.lowStockThreshold ?? undefined;
    this.weight = partial.weight ?? undefined;
    this.barcode = partial.barcode ?? undefined;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;

    if (partial.category) {
      this.category = {
        id: partial.category.id,
        name: partial.category.name,
        slug: partial.category.slug,
      };
    }
    if (partial.subcategory) {
      this.subcategory = {
        id: partial.subcategory.id,
        name: partial.subcategory.name,
        slug: partial.subcategory.slug,
      };
    }
    if (partial.brand) {
      this.brand = {
        id: partial.brand.id,
        name: partial.brand.name,
      };
    }
    if (partial.seoMeta) {
      this.seoMeta = new SeoMetaEntity(partial.seoMeta);
    }
    if (partial.variants) {
      this.variants = partial.variants.map((v: Record<string, any>) => new VariantEntity(v));
    }
    if (partial.images) {
      this.images = partial.images.map((i: Record<string, any>) => new ProductImageEntity(i));
    }
  }
}
