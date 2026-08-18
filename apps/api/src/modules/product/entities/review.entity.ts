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

  @ApiProperty({ type: [String] })
  images: string[];

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

  @ApiPropertyOptional()
  productName?: string;

  @ApiPropertyOptional()
  productImage?: string;

  @ApiPropertyOptional()
  userName?: string;

  @ApiPropertyOptional()
  userEmail?: string;

  @ApiPropertyOptional()
  userPhone?: string;

  @ApiPropertyOptional()
  userImage?: string;

  @ApiPropertyOptional()
  userRole?: string;

  @ApiPropertyOptional()
  isEmailVerified?: boolean;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.productId = partial.productId;
    this.userId = partial.userId ?? undefined;
    this.rating = partial.rating;
    this.title = partial.title ?? undefined;
    this.comment = partial.comment ?? undefined;
    this.images = partial.images ?? [];
    this.isVerifiedPurchase = partial.isVerifiedPurchase;
    this.isApproved = partial.isApproved;
    this.helpfulCount = partial.helpfulCount;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
    this.productName = partial.productName ?? undefined;
    this.productImage = partial.productImage ?? undefined;
    this.userName = partial.userName?.trim() ?? undefined;
    this.userEmail = partial.userEmail ?? undefined;
    this.userPhone = partial.userPhone ?? undefined;
    this.userImage = partial.userImage ?? undefined;
    this.userRole = partial.userRole ?? undefined;
    this.isEmailVerified = partial.isEmailVerified ?? undefined;
  }
}
