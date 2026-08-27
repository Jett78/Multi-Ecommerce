import { Module } from '@nestjs/common';
import { DbModule } from '../../../db/db.module';
import { CourierSettingsService } from './courier-settings.service';
import { CourierSettingsController } from './courier-settings.controller';

@Module({
  imports: [DbModule],
  controllers: [CourierSettingsController],
  providers: [CourierSettingsService],
  exports: [CourierSettingsService],
})
export class CourierSettingsModule {}
