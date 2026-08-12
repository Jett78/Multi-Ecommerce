import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum, IsArray, MaxLength, MinLength, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateProductSeoMetaDto {
  @ApiPropertyOptional({ example: 'iPhone 15 Pro - Best Price' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional({ example: 'Buy iPhone 15 Pro with best price and free shipping' })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({ example: 'https://example.com/products/iphone-15-pro' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  canonicalUrl?: string;

  @ApiPropertyOptional({ example: 'index, follow', default: 'index, follow' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  metaRobots?: string;

  @ApiPropertyOptional({ example: 'iPhone 15 Pro - Share' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  ogTitle?: string;

  @ApiPropertyOptional({ example: 'Check out the new iPhone 15 Pro' })
  @IsOptional()
  @IsString()
  ogDescription?: string;

  @ApiPropertyOptional({ example: 'products/og-image.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  ogImageKey?: string;
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  name: string;

  @ApiProperty({ example: 'iphone-15-pro' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  slug: string;

  @ApiPropertyOptional({ example: 'Latest iPhone with A17 Pro chip' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Advanced smartphone from Apple' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shortDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subcategoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({ example: 'APL-IP15P-128' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ enum: ['draft', 'active', 'archived'], default: 'draft' })
  @IsOptional()
  @IsEnum(['draft', 'active', 'archived'])
  status?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: ['smartphone', 'apple', '5g'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  // Base variant fields — used to auto-create a default variant when no explicit variants are provided.
  // This keeps stock/pricing consistent on product_variants for simple (variant-less) products.
  @ApiPropertyOptional({ example: 99999, description: 'Base price. Used to auto-create a default variant when no variants are provided.' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 109999 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ description: 'Initial stock. Used to auto-create a default variant when no variants are provided.', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ type: CreateProductSeoMetaDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProductSeoMetaDto)
  seoMeta?: CreateProductSeoMetaDto;
}
