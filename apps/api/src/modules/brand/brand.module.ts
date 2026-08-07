import { Module } from '@nestjs/common';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { BrandRepository } from './brand.repository';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository],
  exports: [BrandService],
})
export class BrandModule {}
