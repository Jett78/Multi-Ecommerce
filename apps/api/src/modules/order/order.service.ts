import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { OrderRepository } from './order.repository';
import { VariantRepository } from '../product/variant.repository';
import { DiscountRepository } from '../discount/discount.repository';
import { CourierService } from '../courier/courier.service';
import { mapPathaoEventToOrderStatus, decidePaymentOnDelivered } from '../courier/courier.service';
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
    private readonly courierService: CourierService,
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
    deliveryCharge?: number;
    courierProvider?: string;
    estimatedDeliveryDays?: number;
    district?: string;
    parcelWeightKg?: number;
    deliveryType?: string;
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

        // Calculate delivery charge
        const deliveryCharge = dto.deliveryCharge || 0;
        const isFreeShipping = dto.couponCode && couponRecord?.type === 'free_shipping';
        const finalDeliveryCharge = isFreeShipping ? 0 : deliveryCharge;

        const totalAmount = subtotal - discountAmount + finalDeliveryCharge;

        // Generate order ID
        const orderId = `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

        // Create order
        const order = await this.orderRepository.createOrder({
          orderId,
          userId,
          subtotal,
          discountAmount,
          deliveryCharge: finalDeliveryCharge,
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
          courierProvider: dto.courierProvider,
          estimatedDeliveryDays: dto.estimatedDeliveryDays,
          district: dto.district,
          parcelWeightKg: dto.parcelWeightKg,
          deliveryType: dto.deliveryType,
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

  private resolveDistrict(
    district: string | null | undefined,
    shippingAddress: string | null | undefined,
  ): string | null {
    if (district && district.trim()) {
      return district.trim();
    }

    if (!shippingAddress) return null;

    // Address format: "street, localLevel, district, province, country"
    const parts = shippingAddress
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    return parts[2] || null;
  }

  async sendToCourier(orderId: string) {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    // Idempotent: if a consignment already exists, return it without
    // creating a duplicate Pathao order.
    if (order.courierConsignmentId) {
      return {
        consignmentId: order.courierConsignmentId,
        deliveryFee: order.deliveryCharge ?? 0,
        status: order.status,
        trackingUrl: order.courierTrackingUrl ?? null,
        order,
        alreadySent: true,
      };
    }

    if (!order.courierProvider) {
      throw new BadRequestException('Order has no courier provider configured.');
    }

    const district = this.resolveDistrict(order.district, order.shippingAddress);
    if (!district) {
      throw new BadRequestException('Order has no shipping district to resolve a courier zone.');
    }

    const items = await this.orderRepository.findOrderItems(order.id);
    const itemQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const itemWeight = order.parcelWeightKg ?? 1;
    const amountToCollect = order.paymentMethod === 'cod' ? order.totalAmount : 0;

    try {
      const result = await this.courierService.createShipment({
        provider: order.courierProvider,
        district,
        orderId: order.orderId,
        recipientName: order.customerName || 'Customer',
        recipientPhone: order.customerPhone || '',
        recipientAddress: order.shippingAddress || '',
        itemWeight,
        itemQuantity,
        amountToCollect,
        deliveryType: order.deliveryType ?? 'normal',
      });

      const nextStatus =
        order.status === 'pending' || order.status === 'confirmed'
          ? 'processing'
          : order.status;

      const trackingUrl = await this.courierService.buildTrackingUrl(
        result.consignmentId,
        order.customerPhone,
      );

      const updated = await this.orderRepository.updateCourierConsignment(order.id, {
        courierConsignmentId: result.consignmentId,
        deliveryType: order.deliveryType ?? 'normal',
        status: nextStatus,
        courierTrackingUrl: trackingUrl,
        courierStatus: result.status,
      });

      return {
        consignmentId: result.consignmentId,
        deliveryFee: result.deliveryFee,
        status: result.status,
        trackingUrl,
        order: updated,
        alreadySent: false,
      };
    } catch (error) {
      this.logger.error(`Failed to send order ${orderId} to courier: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sequentially dispatch many eligible orders to the configured courier by
   * reusing the per-order `sendToCourier` flow. This keeps the adapter's
   * built-in request queue in control of Pathao rate limits and writes back
   * per-order consignment data exactly like the single-order endpoint.
   *
   * Only orders that still have no consignment are actually sent; already-sent
   * orders are reported as `skipped`, and any per-order failure is captured
   * without aborting the rest.
   */
  async bulkSendToCourier(orderIds: string[]) {
    const results: Array<{
      id: string;
      orderId: string | null;
      success: boolean;
      alreadySent?: boolean;
      consignmentId?: string | null;
      trackingUrl?: string | null;
      status?: string | null;
      error?: string | null;
    }> = [];

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const id of orderIds) {
      try {
        const result = await this.sendToCourier(id);
        const alreadySent = result.alreadySent === true;

        results.push({
          id,
          orderId: result.order?.orderId ?? null,
          success: true,
          alreadySent,
          consignmentId: result.consignmentId,
          trackingUrl: result.trackingUrl,
          status: result.status,
        });

        if (alreadySent) {
          skipped += 1;
        } else {
          sent += 1;
        }
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Failed to send order to courier';
        results.push({
          id,
          orderId: null,
          success: false,
          error: message,
        });
        failed += 1;
      }
    }

    return {
      results,
      summary: {
        total: orderIds.length,
        sent,
        skipped,
        failed,
      },
    };
  }

  /**
   * Apply a Pathao status (event or slug) to an order, rank-aware and with COD
   * payment completion on delivery. Shared by the webhook receiver and the
   * manual sync button so both behave identically.
   */
  private async applyCourierStatus(
    orderId: string,
    pathaoSlug: string | null | undefined,
    meta?: { collectedAmount?: number },
  ) {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    const target = mapPathaoEventToOrderStatus(pathaoSlug, order.status);

    const updateData: {
      courierConsignmentId: string;
      courierStatus: string | null;
      status?: string;
    } = {
      courierConsignmentId: order.courierConsignmentId!,
      courierStatus: pathaoSlug ?? null,
    };
    if (target) {
      updateData.status = target;
    }

    const updated = await this.orderRepository.updateCourierConsignment(order.id, updateData);

    if (decidePaymentOnDelivered(order, pathaoSlug)) {
      await this.orderRepository.updatePaymentStatus(order.id, 'completed');
      updated.paymentStatus = 'completed';
    }

    this.logger.log(
      `Applied courier status "${pathaoSlug}" to order ${order.orderId} -> ${target ?? order.status}` +
        (meta?.collectedAmount != null ? ` (collected ${meta.collectedAmount})` : ''),
    );

    return updated;
  }

  /**
   * Manually sync an order's status from Pathao's order-info endpoint.
   */
  async syncCourierStatus(orderId: string) {
    const order = await this.orderRepository.findOrderById(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }
    if (!order.courierConsignmentId) {
      throw new BadRequestException('Order has not been sent to courier yet.');
    }

    const info = await this.courierService.getShipmentStatus(order.courierConsignmentId);
    const slug = info.orderStatusSlug || info.orderStatus || null;
    return this.applyCourierStatus(order.id, slug, {
      collectedAmount: undefined,
    });
  }

  /**
   * Webhook entry-point: apply a Pathao status to an order looked up by its
   * consignment id.
   */
  async applyCourierStatusByConsignment(
    consignmentId: string,
    pathaoSlug: string | null | undefined,
    meta?: { collectedAmount?: number },
  ) {
    const order = await this.orderRepository.findOrderByConsignmentId(consignmentId);
    if (!order) {
      this.logger.warn(`Courier webhook for unknown consignment ${consignmentId}`);
      return null;
    }
    return this.applyCourierStatus(order.id, pathaoSlug, meta);
  }
}
