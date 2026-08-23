import type { AppliedCoupon } from "@/types/coupon";

export interface CartItem {
  variantId: string;
  quantity: number;
  priceAtAdd: number;
  productName: string;
  productSlug: string;
  variantSku: string | null;
  stockQuantity: number;
  allowBackorder: boolean;
  imageUrl?: string;
  productId: string;
  attributes?: { attributeName: string; attributeValue: string }[];
}

export interface CartStore {
  items: CartItem[];
  appliedCoupon: AppliedCoupon | null;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
  setCoupon: (coupon: AppliedCoupon | null) => void;
  removeCoupon: () => void;
  discountedTotal: () => number;
}

export interface CartState {
  id: string;
  sessionId: string | null;
  userId: string | null;
  items: {
    id: string;
    variantId: string;
    quantity: number;
    priceAtAdd: number;
    product: {
      id: string;
      name: string;
      slug: string;
      price: number;
    };
    variant: {
      id: string;
      sku: string;
      stockQuantity: number;
      allowBackorder: boolean;
      price: number;
    };
    imageUrl?: string;
  }[];
  totalAmount: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartCountState {
  totalItems: number;
}
