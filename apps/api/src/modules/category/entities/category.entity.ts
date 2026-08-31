import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SubcategoryEntity } from './subcategory.entity';

export class CategoryEntity {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  imageKey?: string;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiPropertyOptional({ type: [SubcategoryEntity] })
  subcategories?: SubcategoryEntity[];

  constructor(partial: Record<string, any>) {
    this.id = partial.id;
    this.name = partial.name;
    this.slug = partial.slug;
    this.imageKey = partial.imageKey ?? undefined;
    this.imageUrl = partial.imageKey ? this.buildUrl(partial.imageKey) : undefined;
    this.sortOrder = partial.sortOrder;
    this.isActive = partial.isActive;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
    if (partial.subcategories) {
      this.subcategories = partial.subcategories.map(
        (sub: Record<string, any>) => new SubcategoryEntity(sub),
      );
    }
  }

  private buildUrl(key: string): string {
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL || '';
    const bucketName = process.env.S3_BUCKET_NAME || '';
    const region = process.env.AWS_REGION || 'ap-south-1';

    if (cloudfrontUrl) {
      return `https://${cloudfrontUrl}/${key}`;
    }
    if (bucketName) {
      return `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    }
    return '';
  }
}
