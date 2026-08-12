import { IsString, IsOptional, IsBoolean, IsNumber, MaxLength, MinLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'electronics' })
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  slug: string;

  @ApiPropertyOptional({ example: 'categories/electronics.jpg' })
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
}
