export interface CartItem {
  id: string;
  cartId: string;
  variantId: string;
  quantity: number;
  priceAtAdd: number;
  createdAt?: string;
  updatedAt?: string;
  variant: {
    id: string;
    sku: string | null;
    price: number;
    stockQuantity: number;
    allowBackorder: boolean;
  };
  product: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface Cart {
  id: string;
  userId: string | null;
  sessionId: string;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartState {
  cart: Cart;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

export interface CartCountState {
  itemCount: number;
}
