export interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  usageLimit: number | null;
  usageCount: number;
  perUserLimit: number | null;
  categoryIds: string[] | null;
  brandIds: string[] | null;
  filterLogic: string;
  isActive: boolean;
  description: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

export interface CouponData {
  id?: string;
  code?: string;
  type?: string;
  value?: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  categoryIds?: string[] | null;
  brandIds?: string[] | null;
  filterLogic?: string;
  isActive?: boolean;
  description?: string | null;
  startsAt?: string | null;
  expiresAt?: string | null;
}

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  type: string;
  description: string;
}
