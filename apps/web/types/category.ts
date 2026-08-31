import { BaseEntity } from "./base-entity";

export interface Category extends BaseEntity {
  name: string;
  slug: string;
  imageKey?: string;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface Subcategory extends BaseEntity {
  name: string;
  slug: string;
  imageKey?: string;
  sortOrder: number;
  isActive: boolean;
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}
