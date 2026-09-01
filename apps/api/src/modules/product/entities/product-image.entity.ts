import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductImageEntity {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  productId?: string;

  @ApiPropertyOptional()
  variantId?: string;

  @ApiProperty()
  imageKey: string;

  @ApiProperty()
  url: string;

  @ApiPropertyOptional()
  altText?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isPrimary: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.productId = partial.productId ?? undefined;
    this.variantId = partial.variantId ?? undefined;
    this.imageKey = partial.imageKey;
    this.url = this.buildUrl(partial.imageKey);
    this.altText = partial.altText ?? undefined;
    this.sortOrder = partial.sortOrder;
    this.isPrimary = partial.isPrimary;
    this.createdAt = partial.createdAt;
  }

  private buildUrl(key: string): string {
    if (key.startsWith('http://') || key.startsWith('https://')) {
      return key;
    }
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL || '';
    const bucketName = process.env.S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-south-1';

    if (cloudfrontUrl) {
      return `https://${cloudfrontUrl}/${key}`;
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
  }
}
