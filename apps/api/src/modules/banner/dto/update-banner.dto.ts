import { PartialType } from '@nestjs/swagger';
import { CreateBannerDto } from './create-banner.dto';
import { IsOptional, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBannerDto extends PartialType(CreateBannerDto) {
  @ApiPropertyOptional({ example: 2, description: 'New sort order - triggers swap if changed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}
