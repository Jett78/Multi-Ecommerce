import { Module } from '@nestjs/common';
import { DbModule } from '../../../db/db.module';
import { VariantAttributeController } from './variant-attribute.controller';
import { VariantAttributeService } from './variant-attribute.service';
import { VariantAttributeRepository } from './variant-attribute.repository';

@Module({
  imports: [DbModule],
  controllers: [VariantAttributeController],
  providers: [VariantAttributeService, VariantAttributeRepository],
  exports: [VariantAttributeService, VariantAttributeRepository],
})
export class VariantAttributeModule {}
