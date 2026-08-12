import { IsString, IsUUID, IsOptional, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantAttributeDto {
  @ApiProperty({ 
    description: 'Product variant ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a526-426614174000'
  })
  @IsUUID()
  variantId: string;

  @ApiProperty({ example: 'Color', maxLength: 100 })
  @IsString()
  @MaxLength(100)
  attributeName: string;

  @ApiProperty({ example: 'Red', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  attributeValue: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
