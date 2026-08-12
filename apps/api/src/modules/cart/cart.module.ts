import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartRepository } from './cart.repository';
import { ProductModule } from '../product/product.module';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule, ProductModule],
  controllers: [CartController],
  providers: [CartService, CartRepository],
  exports: [CartService],
})
export class CartModule {}
