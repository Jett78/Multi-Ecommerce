import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CourierSettingsModule } from './courier-settings/courier-settings.module';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { CourierRepository } from './courier.repository';

@Module({
  imports: [DbModule, CourierSettingsModule],
  controllers: [CourierController],
  providers: [CourierService, CourierRepository],
  exports: [CourierService],
})
export class CourierModule {}
