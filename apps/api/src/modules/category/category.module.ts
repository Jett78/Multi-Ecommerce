import { Module } from '@nestjs/common';
import { CategoryController, SubcategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [CategoryController, SubcategoryController],
  providers: [CategoryService, CategoryRepository],
  exports: [CategoryService],
})
export class CategoryModule {}
