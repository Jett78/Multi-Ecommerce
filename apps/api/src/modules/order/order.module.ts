import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { OrderRepository } from './order.repository';
import { ProductModule } from '../product/product.module';
import { DiscountModule } from '../discount/discount.module';
import { CourierModule } from '../courier/courier.module';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule, ProductModule, DiscountModule, CourierModule],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository],
  exports: [OrderService, OrderRepository],
})
export class OrderModule {}
