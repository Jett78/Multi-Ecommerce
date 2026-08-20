import { Injectable, NotFoundException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { OrderRepository } from './order.repository';
import { VariantRepository } from '../product/variant.repository';
import { DB_CONNECTION } from '../../db/db.module';
import * as schema from '../../db/schema';
import { randomUUID } from 'crypto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly variantRepository: VariantRepository,
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
        const totalAmount = subtotal;

        // Generate order ID
        const orderId = `ORD-${Date.now()}-${randomUUID().slice(0, 8).toUpperCase()}`;

        // Create order
        const order = await this.orderRepository.createOrder({
          orderId,
          userId,
          subtotal,
          totalAmount,
          paymentMethod: dto.paymentMethod,
          customerName: dto.customerName,
          customerEmail: dto.customerEmail,
          customerPhone: dto.customerPhone,
          shippingAddress: dto.shippingAddress,
          billingAddress: dto.billingAddress,
          landmark: dto.landmark,
          notes: dto.notes,
        }, trx);

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
    return {
      ...order,
      items,
    };
  }

  async getOrderByOrderId(orderId: string) {
    const order = await this.orderRepository.findOrderByOrderId(orderId);
    if (!order) {
      throw new NotFoundException(`Order with id "${orderId}" not found`);
    }

    const items = await this.orderRepository.findOrderItems(order.id);
    return {
      ...order,
      items,
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
