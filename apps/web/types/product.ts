import { BaseEntity } from "./base-entity";

export interface Product extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string;
  brandId?: string;
  sku?: string;
  status: "draft" | "active" | "archived";
  isFeatured: boolean;
  sortOrder: number;
  tags?: string[];
  isActive: boolean;
  price?: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity?: number;
  allowBackorder?: boolean;
  lowStockThreshold?: number;
  weight?: number;
  barcode?: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  subcategory?: {
    id: string;
    name: string;
    slug: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  variants?: ProductVariant[];
  images?: ProductImage[];
  seoMeta?: {
    metaTitle?: string;
    metaDescription?: string;
    canonicalUrl?: string;
    metaRobots?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImageKey?: string;
  };
}

export interface ProductVariant extends BaseEntity {
  productId: string;
  sku: string;
  name?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  stockQuantity: number;
  allowBackorder: boolean;
  lowStockThreshold?: number;
  weight?: number;
  barcode?: string;
  isActive: boolean;
  sortOrder: number;
  attributes?: VariantAttribute[];
  images?: ProductImage[];
}

export interface VariantAttribute {
  id: string;
  variantId: string;
  attributeName: string;
  attributeValue: string;
  sortOrder: number;
}

export interface ProductImage {
  id: string;
  productId?: string;
  variantId?: string;
  imageKey: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}
