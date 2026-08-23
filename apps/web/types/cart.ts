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
