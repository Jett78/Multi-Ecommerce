import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { OrderRepository } from './order.repository';
import { VariantRepository } from '../product/variant.repository';
import { DiscountRepository } from '../discount/discount.repository';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { randomUUID } from 'crypto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly variantRepository: VariantRepository,
    private readonly discountRepository: DiscountRepository,
    @Inject(DB_CONNECTION)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async createOrderFromCart(userId: string, dto: {
    items: { variantId: string; quantity: number; priceAtAdd: number }[];
    paymentMethod: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    shippingAddress: string;
    billingAddress?: string;
    landmark?: string;
    notes?: string;
    couponCode?: string;
  }) {
    try {
      if (!dto.items || dto.items.length === 0) {
        throw new BadRequestException('Cart is empty');
      }

      // Wrap the whole flow in a single transaction. If any step fails
      // (validation, order insert, item insert, or stock decrement), every
      // change is rolled back — so a failed checkout never leaves an orphaned
      // order or decremented stock behind.
      return await this.db.transaction(async (tx) => {
        const trx = tx as unknown as NodePgDatabase<typeof schema>;

        // Validate stock for all items using variant repository
        const orderItems: { variantId: string; productName: string; quantity: number; unitPrice: number }[] = [];

        for (const item of dto.items) {
          const variant = await this.variantRepository.findVariantById(item.variantId, trx);
          if (!variant) {
            throw new NotFoundException(`Variant "${item.variantId}" not found`);
          }

          if (!variant.allowBackorder && variant.stockQuantity < item.quantity) {
            throw new BadRequestException(
              `Insufficient stock for variant "${variant.sku || variant.id}". Available: ${variant.stockQuantity}`
            );
          }

          const product = await this.variantRepository.findProductByVariantId(item.variantId, trx);
          orderItems.push({
            variantId: item.variantId,
            productName: product?.name || 'Unknown Product',
            quantity: item.quantity,
            unitPrice: item.priceAtAdd,
          });
        }

        // Calculate totals
        const subtotal = orderItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

        // Validate and apply coupon if provided
        let discountAmount = 0;
        let couponId: string | undefined;
        let couponRecord: any = null;

        if (dto.couponCode) {
          const coupon = await this.discountRepository.findByCode(dto.couponCode);
          if (!coupon) {
            throw new BadRequestException('Invalid coupon code');
          }

          const validation = await this.discountRepository.findByCode(dto.couponCode);
          if (!validation) {
            throw new BadRequestException('Invalid coupon code');
          }

          const now = new Date();
          if (!coupon.isActive) {
            throw new BadRequestException('This coupon is no longer active');
          }
          if (coupon.startsAt && now < coupon.startsAt) {
            throw new BadRequestException('This coupon is not yet active');
          }
          if (coupon.expiresAt && now > coupon.expiresAt) {
            throw new BadRequestException('This coupon has expired');
          }
          if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
            throw new BadRequestException('This coupon has reached its usage limit');
          }
          if (userId && coupon.perUserLimit !== null) {
            const userUsage = await this.discountRepository.countUserCouponUsage(userId, coupon.id);
            if (userUsage >= coupon.perUserLimit) {
              throw new BadRequestException('You have already used this coupon the maximum number of times');
            }
          }
          if (coupon.minOrderAmount !== null && subtotal < coupon.minOrderAmount / 100) {
            throw new BadRequestException(`Minimum order amount is Rs. ${(coupon.minOrderAmount / 100).toLocaleString()}`);
          }

          // Calculate discount
          switch (coupon.type) {
            case 'fixed':
              discountAmount = Math.min(coupon.value / 100, subtotal);
              break;
            case 'percentage':
              discountAmount = Math.floor((subtotal * coupon.value) / 100);
              if (coupon.maxDiscountAmount !== null) {
                discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount / 100);
              }
              break;
            case 'free_shipping':
              discountAmount = 0;
              break;
          }

          couponId = coupon.id;
          couponRecord = coupon;
        }

        const totalAmount = subtotal - discountAmount;

        // Generate order ID
        const orderId = `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

        // Create order
        const order = await this.orderRepository.createOrder({
          orderId,
          userId,
          subtotal,
          discountAmount,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          shippingAddress: dto.shippingAddress,
          billingAddress: dto.billingAddress,
          landmark: dto.landmark,
          notes: dto.notes,
          couponId,
        }, trx);

        // Record coupon usage if a coupon was applied
        if (couponId && couponRecord) {
          await this.discountRepository.createOrderCoupon({
            orderId: order.id,
            couponId,
            couponCode: couponRecord.code,
            discountAmount,
          }, trx);
          await this.discountRepository.incrementUsageCount(couponId, trx);
        }

        // Create order items and decrement stock
        for (const item of orderItems) {
          await this.orderRepository.createOrderItem({
            orderId: order.id,
            variantId: item.variantId,
            productName: item.productName,
            variantName: `SKU-${item.variantId.slice(0, 8)}`,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalAmount: item.unitPrice * item.quantity,
          }, trx);

          // Decrement stock
          await this.variantRepository.adjustStock(
            item.variantId,
            -item.quantity,
            orderId,
            `Order ${orderId}`,
            undefined,
            trx,
          );
        }

        // Return order with items
        const createdItems = await this.orderRepository.findOrderItems(order.id, trx);
        return {
          ...order,
          items: createdItems,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to create order: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    const items = await this.orderRepository.findOrderItems(order.id);
    const orderCoupons = await this.orderRepository.findOrderCoupons(order.id);
    return {
      ...order,
      items,
      orderCoupons,
    };
  }

  async getOrderByOrderId(orderId: string) {
    const order = await this.orderRepository.findOrderByOrderId(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    const items = await this.orderRepository.findOrderItems(order.id);
    const orderCoupons = await this.orderRepository.findOrderCoupons(order.id);
    return {
      ...order,
      items,
      orderCoupons,
    };
  }

  async getUserOrders(userId: string, page: number = 1, limit: number = 10) {
    return this.orderRepository.findOrdersByUserId(userId, page, limit);
  }

  async getAllOrders(page: number = 1, limit: number = 10, filters?: {
    status?: string;
    paymentMethod?: string;
    paymentStatus?: string;
    sort?: string;
  }) {
    return this.orderRepository.findAllOrders(page, limit, filters);
  }

  async updateOrderStatus(id: string, status: string) {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    return this.orderRepository.updateOrderStatus(id, status);
  }

  async updatePaymentStatus(id: string, paymentStatus: string, transactionId?: string) {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    return this.orderRepository.updatePaymentStatus(id, paymentStatus, transactionId);
  }

  async deleteOrder(id: string) {
    const order = await this.orderRepository.findOrderById(id);
    if (!order) {
      throw new NotFoundException(`Order with id "${id}" not found`);
    }

    return this.orderRepository.deleteOrder(id);
  }

  async getOrderStats() {
    return this.orderRepository.getOrderStats();
  }
}
