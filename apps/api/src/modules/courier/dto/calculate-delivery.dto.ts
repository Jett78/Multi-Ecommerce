import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CalculateDeliveryDto {
  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  weightKg: number;

  @ApiPropertyOptional({ example: 1500 })
  @IsNumber()
  @IsOptional()
  codAmount?: number;

  @ApiPropertyOptional({ example: 'normal' })
  @IsString()
  @IsOptional()
  deliveryType?: string;
}

export class BatchCalculateItemDto {
  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 2.5 })
  @IsNumber()
  weightKg: number;

  @ApiPropertyOptional({ example: 'pathao' })
  @IsString()
  @IsOptional()
  provider?: string;

  @ApiPropertyOptional({ example: 1500 })
  @IsNumber()
  @IsOptional()
  codAmount?: number;

  @ApiPropertyOptional({ example: 'normal' })
  @IsString()
  @IsOptional()
  deliveryType?: string;
}

export class BatchCalculateDto {
  @ApiProperty({ type: [BatchCalculateItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCalculateItemDto)
  items: BatchCalculateItemDto[];
}
