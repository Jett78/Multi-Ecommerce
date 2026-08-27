import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemResponse {
  @ApiProperty({ description: 'Order item ID', example: 'c0ffee00-0000-0000-0000-000000000010' })
  id: string;

  @ApiProperty({ description: 'Order ID', example: '11111111-0000-0000-0000-000000000001' })
  orderId: string;

  @ApiProperty({ description: 'Product variant ID', example: 'a1b2c3d4-0000-0000-0000-000000000001' })
  variantId: string;

  @ApiProperty({ description: 'Product name', example: 'Nike Air Max' })
  productName: string;

  @ApiPropertyOptional({ description: 'Variant name', example: 'SKU-A1B2C3D4' })
  variantName?: string;

  @ApiPropertyOptional({ description: 'SKU', example: 'NK-AM-001' })
  sku?: string;

  @ApiProperty({ description: 'Quantity', example: 2 })
  quantity: number;

  @ApiProperty({ description: 'Unit price at purchase (in paisa)', example: 129900 })
  unitPrice: number;

  @ApiProperty({ description: 'Total amount for this item (in paisa)', example: 259800 })
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Product image URL', example: 'https://cdn.example.com/img.jpg' })
  image?: string | null;

  @ApiPropertyOptional({
    description: 'Item attributes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        attributeName: { type: 'string', example: 'Size' },
        attributeValue: { type: 'string', example: '42' },
      },
    },
    example: [{ attributeName: 'Size', attributeValue: '42' }],
  })
  attributes?: { attributeName: string; attributeValue: string }[];
}

export class OrderResponse {
  @ApiProperty({ description: 'Order primary ID', example: '11111111-0000-0000-0000-000000000001' })
  id: string;

  @ApiProperty({ description: 'Human readable order ID', example: 'ORD-1692547200000-AB12CD34' })
  orderId: string;

  @ApiPropertyOptional({ description: 'Payment index (pidx) for Khalti', example: null })
  pidx?: string | null;

  @ApiPropertyOptional({ description: 'User ID (null for guest checkout)', example: '22222222-0000-0000-0000-000000000002' })
  userId?: string | null;

  @ApiProperty({ description: 'Subtotal (in paisa)', example: 259800 })
  subtotal: number;

  @ApiProperty({ description: 'Discount amount (in paisa)', example: 0 })
  discountAmount: number;

  @ApiProperty({ description: 'Tax amount (in paisa)', example: 0 })
  taxAmount: number;

  @ApiProperty({ description: 'Total amount (in paisa)', example: 259800 })
  totalAmount: number;

  @ApiProperty({ description: 'Currency', example: 'NPR' })
  currency: string;

  @ApiProperty({ description: 'Order status', enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'], example: 'pending' })
  status: string;

  @ApiProperty({ description: 'Payment status', enum: ['pending', 'completed', 'failed', 'refunded', 'expired', 'cancelled'], example: 'pending' })
  paymentStatus: string;

  @ApiProperty({ description: 'Payment method', enum: ['khalti', 'cod'], example: 'cod' })
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Transaction ID', example: null })
  transactionId?: string | null;

  @ApiPropertyOptional({ description: 'Stripe payment intent ID', example: null })
  stripePaymentIntentId?: string | null;

  @ApiProperty({ description: "Customer's name", example: 'Ram Sharma' })
  customerName: string;

  @ApiProperty({ description: "Customer's email", example: 'ram.sharma@example.com' })
  customerEmail: string;

  @ApiPropertyOptional({ description: "Customer's phone", example: '+977 9800000000' })
  customerPhone?: string | null;

  @ApiProperty({ description: 'Shipping address', example: 'Baluwatar, Kathmandu, Province 3, Nepal' })
  shippingAddress: string;

  @ApiPropertyOptional({ description: 'Billing address', example: 'Baluwatar, Kathmandu, Nepal' })
  billingAddress?: string | null;

  @ApiPropertyOptional({ description: 'Landmark', example: 'Next to City Mall' })
  landmark?: string | null;

  @ApiPropertyOptional({ description: 'Notes', example: 'Please deliver after 5 PM' })
  notes?: string | null;

  @ApiProperty({ description: 'Created at', example: '2025-08-20T12:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ description: 'Updated at', example: '2025-08-20T12:00:00.000Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Order items', type: OrderItemResponse, isArray: true })
  items?: OrderItemResponse[];
}

export class OrderListResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Orders fetched successfully' })
  message: string;

  @ApiProperty({ type: OrderResponse, isArray: true })
  data: OrderResponse[];

  @ApiProperty({ description: 'Total number of orders', example: 42 })
  total: number;

  @ApiProperty({ description: 'Offset applied', example: 0 })
  skip: number;

  @ApiProperty({ description: 'Limit applied', example: 10 })
  take: number;

  @ApiProperty({ description: 'Whether more pages exist', example: true })
  hasMore: boolean;
}

export class OrderStatsResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Order stats fetched successfully' })
  message: string;

  @ApiProperty({ description: 'Total orders', example: 120 })
  data: {
    totalOrders: number;
    totalRevenue: number;
    pendingOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
  };
}

export class OrderCreatedResponse {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 201 })
  statusCode: number;

  @ApiProperty({ example: 'Order placed successfully' })
  message: string;

  @ApiProperty({ type: OrderResponse })
  data: OrderResponse;
}
