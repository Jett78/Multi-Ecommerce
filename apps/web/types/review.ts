import { BaseEntity } from "./base-entity";

export interface Review extends BaseEntity {
  productId: string;
  userId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  productName?: string;
  productImage?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userImage?: string;
  userRole?: string;
  isEmailVerified?: boolean;
}

export interface ReviewListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: Review[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
  avgRating: number;
  totalReviews: number;
}

export interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface RatingBreakdownResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    averageRating: number;
    totalReviews: number;
    breakdown: RatingBreakdown;
  };
}

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  comment?: string;
}
