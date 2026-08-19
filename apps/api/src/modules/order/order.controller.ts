import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { RequirePermissions } from '../../decorators/require-permissions.decorator';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateBuyNowOrderDto } from './dto/create-buy-now-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { GetOrdersQueryDto } from './dto/get-orders-query.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  @HttpCode(HttpStatus.CREATED)
  async checkout(
    @Session() session: UserSession,
    @Body() dto: CreateOrderDto,
  ) {
    const userId = session?.user?.id;
    return this.orderService.createOrderFromCart(userId, dto);
  }

  @Post('buy-now')
  @HttpCode(HttpStatus.CREATED)
  async buyNow(
    @Session() session: UserSession,
    @Body() dto: CreateBuyNowOrderDto,
  ) {
    const userId = session?.user?.id;
    return this.orderService.createOrderFromBuyNow(userId, dto);
  }

  @Get('my')
  async getMyOrders(
    @Session() session: UserSession,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = session?.user?.id;
    return this.orderService.getUserOrders(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('stats')
  @RequirePermissions('order.read')
  async getStats() {
    return this.orderService.getOrderStats();
  }

  @Get()
  @RequirePermissions('order.read')
  async findAll(
    @Query() query: GetOrdersQueryDto,
  ) {
    return this.orderService.getAllOrders(
      query.page ? parseInt(query.page, 10) : 1,
      query.limit ? parseInt(query.limit, 10) : 10,
      {
        status: query.status,
        paymentMethod: query.paymentMethod,
        paymentStatus: query.paymentStatus,
      },
    );
  }

  @Get(':id')
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

    return order;
  }

  @Put(':id/status')
  @RequirePermissions('order.manage')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(id, dto.status);
  }
}
