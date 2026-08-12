import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdjustStockDto {
  @ApiProperty({ example: 10, description: 'Quantity to add (positive) or remove (negative)' })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ example: 'ORDER-123' })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional({ example: 'Restocking from supplier' })
  @IsOptional()
  @IsString()
  notes?: string;
}
