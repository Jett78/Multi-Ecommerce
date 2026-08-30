import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BannerEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty()
  type: string;

  @ApiPropertyOptional()
  link?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.title = partial.title;
    this.imageUrl = partial.imageUrl;
    this.type = partial.type;
    this.link = partial.link ?? undefined;
    this.sortOrder = partial.sortOrder;
    this.isActive = partial.isActive;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
