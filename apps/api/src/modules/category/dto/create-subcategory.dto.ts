import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, MaxLength, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubcategoryDto {
  @ApiProperty({ example: 'Smartphones' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'smartphones' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  slug: string;

  @ApiPropertyOptional({ example: 'subcategories/smartphones.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageKey?: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @IsUUID()
  categoryId: string;
}
