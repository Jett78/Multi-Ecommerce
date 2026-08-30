import { Module } from '@nestjs/common';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';
import { BannerRepository } from './banner.repository';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [BannerController],
  providers: [BannerService, BannerRepository],
  exports: [BannerService],
})
export class BannerModule {}
