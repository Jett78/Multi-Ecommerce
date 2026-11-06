import { BaseEntity, CommonResponse } from "./base-entity";

export interface SeoMeta {
  id: string;
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  metaRobots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImageKey?: string;
  createdAt: Date;
  updatedAt: Date;
  blogId?: string;
}

export interface Blog extends BaseEntity {
  title: string;
  slug: string;
  imageKey?: string;
  description?: string;
  isActive: boolean;
  seoMeta?: SeoMeta;
}

export interface BlogListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Blog[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}
export type BlogResponse = CommonResponse<Blog>;
