import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  productId: string;

  @ApiPropertyOptional()
  userId?: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  comment?: string;

  @ApiProperty()
  isVerifiedPurchase: boolean;

  @ApiProperty()
  isApproved: boolean;

  @ApiProperty()
  helpfulCount: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.productId = partial.productId;
    this.userId = partial.userId ?? undefined;
    this.rating = partial.rating;
    this.title = partial.title ?? undefined;
    this.comment = partial.comment ?? undefined;
    this.isVerifiedPurchase = partial.isVerifiedPurchase;
    this.isApproved = partial.isApproved;
    this.helpfulCount = partial.helpfulCount;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}
