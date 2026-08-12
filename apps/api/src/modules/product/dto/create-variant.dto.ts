import { IsString, IsOptional, IsBoolean, IsNumber, IsArray, ValidateNested, MaxLength, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateVariantAttributeDto {
  @ApiProperty({ example: 'Color' })
  @IsString()
  @MaxLength(100)
  attributeName: string;

  @ApiProperty({ example: 'Blue' })
  @IsString()
  @MaxLength(255)
  attributeValue: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'APL-IP15P-128-BLU' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({ example: '128GB - Blue' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  name?: string;

  @ApiProperty({ example: 99999 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 109999 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowBackorder?: boolean;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ type: [CreateVariantAttributeDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantAttributeDto)
  attributes?: CreateVariantAttributeDto[];
}
