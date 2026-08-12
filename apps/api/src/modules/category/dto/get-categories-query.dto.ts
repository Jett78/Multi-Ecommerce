import { IsOptional, IsNumber, IsString, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class GetCategoriesQueryDto {
  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(0)
  skip?: number = 0;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Min(1)
  @Max(100)
  take?: number = 10;

  @ApiPropertyOptional({ example: 'search query' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}

export class GetSubcategoriesQueryDto extends GetCategoriesQueryDto {
  @ApiPropertyOptional({ example: 'category-uuid' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
