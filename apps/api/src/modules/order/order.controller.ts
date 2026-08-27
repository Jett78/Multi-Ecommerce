import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AllowAnonymous, Session, UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { ApiTags, ApiOperation, ApiCreatedResponse, ApiOkResponse } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';
import { OrderResponse, OrderListResponse, OrderStatsResponse, OrderCreatedResponse } from './dto/order-response.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @AllowAnonymous()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Place an order from cart (checkout)' })
  @ApiCreatedResponse({ type: OrderCreatedResponse })
  async checkout(
    @Session() session: UserSession,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = session?.user?.id;
    const result = await this.orderService.createOrderFromCart(userId, dto);
    return {
      success: true,
      statusCode: 201,
      message: 'Order placed successfully',
      data: result,
    };
  }

  @Get('my')
  @ApiOperation({ summary: 'Get the current user orders' })
  @ApiOkResponse({ type: OrderListResponse })
  async getMyOrders(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = session?.user?.id;
    const result = await this.orderService.getUserOrders(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Orders fetched successfully',
      data: result,
    };
  }

  @Get('stats')
  @RequirePermissions('order.read')
  @ApiOperation({ summary: 'Get order statistics' })
  @ApiOkResponse({ type: OrderStatsResponse })
  async getStats() {
    const result = await this.orderService.getOrderStats();
    return {
      success: true,
      statusCode: 200,
      message: 'Order stats fetched successfully',
      data: result,
    };
  }

  @Get()
  @RequirePermissions('order.read')
  @ApiOperation({ summary: 'List all orders (admin)' })
  @ApiOkResponse({ type: OrderListResponse })
  async findAll(
    @Query() query: GetOrdersQueryDto,
  ) {
    const page = query.page ? parseInt(query.page, 10) : 1;
    const limit = query.limit ? parseInt(query.limit, 10) : 10;
    const result = await this.orderService.getAllOrders(
      page,
      limit,
      {
        status: query.status,
        paymentMethod: query.paymentMethod,
        paymentStatus: query.paymentStatus,
        sort: query.sort,
      },
    );
    return {
      success: true,
      statusCode: 200,
      message: 'Orders fetched successfully',
      data: result.orders,
      total: result.totalCount,
      skip: (page - 1) * limit,
      take: limit,
      hasMore: page < result.totalPages,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by ID' })
  @ApiOkResponse({ type: OrderResponse })
  async findOne(
    @Param('id') id: string,
    @Session() session: UserSession,
  ) {
    const order = await this.orderService.getOrderById(id);

    // Users can only view their own orders (unless admin)
    if (order.userId !== session?.user?.id && session?.user?.role !== 'super_admin') {
      const adminRoles = ['admin', 'manager'];
      if (!adminRoles.includes(session?.user?.role as string)) {
        throw new Error('Unauthorized');
      }
    }

    return {
      success: true,
      statusCode: 200,
      message: 'Order fetched successfully',
      data: order,
    };
  }

  @Put(':id/status')
  @RequirePermissions('order.manage')
  @ApiOperation({ summary: 'Update order status (admin)' })
  @ApiOkResponse({ type: OrderResponse })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const result = await this.orderService.updateOrderStatus(id, dto.status);
    return {
      success: true,
      statusCode: 200,
      message: 'Order status updated successfully',
      data: result,
    };
  }

  @Put(':id/payment-status')
  @RequirePermissions('order.manage')
  @ApiOperation({ summary: 'Update payment status (admin)' })
  @ApiOkResponse({ type: OrderResponse })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    const result = await this.orderService.updatePaymentStatus(id, dto.paymentStatus, dto.transactionId);
    return {
      success: true,
      statusCode: 200,
      message: 'Payment status updated successfully',
      data: result,
    };
  }

  @Post(':id/send-to-courier')
  @RequirePermissions('order.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send an order to the configured courier (admin)' })
  async sendToCourier(@Param('id') id: string) {
    const result = await this.orderService.sendToCourier(id);
    return {
      success: true,
      statusCode: 200,
      message: result.alreadySent
        ? 'Order was already sent to courier'
        : 'Order sent to courier successfully',
      data: result,
    };
  }

  @Post(':id/sync-courier')
  @RequirePermissions('order.update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync order status from the courier (admin)' })
  async syncCourier(@Param('id') id: string) {
    const result = await this.orderService.syncCourierStatus(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Order status synced from courier',
      data: result,
    };
  }

  @Delete(':id')
  @RequirePermissions('order.manage')
  async remove(@Param('id') id: string) {
    await this.orderService.deleteOrder(id);
    return {
      success: true,
      statusCode: 200,
      message: 'Order deleted successfully',
    };
  }
}
