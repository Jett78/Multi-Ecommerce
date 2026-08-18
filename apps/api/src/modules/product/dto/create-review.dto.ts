import { IsString, IsOptional, IsNumber, Min, Max, MaxLength, IsArray, IsString as IsStringValidator } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Great product!' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiPropertyOptional({ example: 'Really love this phone, camera is amazing...' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ example: ['image-key-1.jpg', 'image-key-2.jpg'], description: 'Array of uploaded image keys' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
