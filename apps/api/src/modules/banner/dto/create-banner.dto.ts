import { IsString, IsOptional, IsBoolean, MaxLength, MinLength, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBannerDto {
  @ApiProperty({ example: 'Summer Sale' })
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'banners/summer-sale.jpg' })
  @IsString()
  @MaxLength(500)
  imageUrl: string;

  @ApiProperty({ example: 'hero', enum: ['hero', 'mid'] })
  @IsString()
  @IsIn(['hero', 'mid'])
  type: string;

  @ApiPropertyOptional({ example: '/products/summer-collection' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  link?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
