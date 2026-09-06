import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FlashSaleEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  startsAt: Date;

  @ApiProperty()
  endsAt: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional()
  products?: any[];

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.name = partial.name;
    this.slug = partial.slug;
    this.description = partial.description ?? undefined;
    this.startsAt = partial.startsAt;
    this.endsAt = partial.endsAt;
    this.isActive = partial.isActive;
    this.imageUrl = partial.imageUrl ?? undefined;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
    this.products = partial.products ?? undefined;
  }
}
