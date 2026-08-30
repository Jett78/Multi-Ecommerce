import { BaseEntity, PaginatedResponse, CommonResponse } from "./base-entity";

export interface Banner extends BaseEntity {
  title: string;
  imageUrl: string;
  type: "hero" | "mid";
  link?: string;
  sortOrder: number;
  isActive: boolean;
}

export type BannerListResponse = CommonResponse<PaginatedResponse<Banner>>;
export type BannerResponse = CommonResponse<Banner>;
