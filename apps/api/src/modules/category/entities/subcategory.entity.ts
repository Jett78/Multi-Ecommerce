import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubcategoryEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  imageKey?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  categoryId: string;

  @ApiPropertyOptional()
  category?: {
    id: string;
    name: string;
    slug: string;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.name = partial.name;
    this.slug = partial.slug;
    this.imageKey = partial.imageKey ?? undefined;
    this.sortOrder = partial.sortOrder;
    this.isActive = partial.isActive;
    this.categoryId = partial.categoryId;
    if (partial.category) {
      this.category = {
        id: partial.category.id,
        name: partial.category.name,
        slug: partial.category.slug,
      };
    }
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
