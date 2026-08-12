import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { VariantRepository } from './variant.repository';
import { ReviewRepository } from './review.repository';
import { DbModule } from '../../db/db.module';
import { VariantAttributeModule } from './variant-attribute/variant-attribute.module';

@Module({
  imports: [DbModule, VariantAttributeModule],
  controllers: [ProductController],
  providers: [ProductService, ProductRepository, VariantRepository, ReviewRepository],
  exports: [ProductService, ProductRepository, VariantRepository, VariantAttributeModule],
})
export class ProductModule {}
