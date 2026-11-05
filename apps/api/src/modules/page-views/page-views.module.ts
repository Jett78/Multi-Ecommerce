import { Module } from '@nestjs/common';
import { PageViewsController } from './page-views.controller';
import { PageViewsService } from './page-views.service';
import { DbModule } from '../../db/db.module';

@Module({
  imports: [DbModule],
  controllers: [PageViewsController],
  providers: [PageViewsService],
  exports: [PageViewsService],
})
export class PageViewsModule {}
