export type PaymentMethod = 'khalti' | 'cod' | 'stripe';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded' | 'expired' | 'cancelled';

export interface OrderItemAttribute {
  attributeName: string;
  attributeValue: string;
}

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
  image: string | null;
  attributes?: OrderItemAttribute[];
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
  landmark: string | null;
  notes: string | null;
  metadata: string | null;
  couponId: string | null;
  courierProvider: string | null;
  courierConsignmentId: string | null;
  courierTrackingUrl: string | null;
  courierStatus: string | null;
  deliveryType: string | null;
  district: string | null;
  parcelWeightKg: number | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
  orderCoupons?: OrderCoupon[];
}

export interface OrderCoupon {
  id: string;
  orderId: string;
  couponId: string;
  couponCode: string;
  discountAmount: number;
  createdAt: string;
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
  landmark?: string;
  notes?: string;
  couponCode?: string;
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
