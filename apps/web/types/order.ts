export type PaymentMethod = 'khalti' | 'cod' | 'stripe';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'expired' | 'cancelled';

export interface OrderItem {
  id: string;
  orderId: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  sku: string | null;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  variant: {
    id: string;
    sku: string | null;
  };
}

export interface Order {
  id: string;
  orderId: string;
  pidx: string | null;
  userId: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  transactionId: string | null;
  stripePaymentIntentId: string | null;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: string | null;
  billingAddress: string | null;
  notes: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface CreateOrderItem {
  variantId: string;
  quantity: number;
  priceAtAdd: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItem[];
  paymentMethod: PaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  billingAddress?: string;
  notes?: string;
}

export interface CreateBuyNowOrderPayload extends CreateOrderPayload {
  variantId: string;
  quantity: number;
}

export interface OrderListResponse {
  orders: Order[];
  totalCount: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
}
