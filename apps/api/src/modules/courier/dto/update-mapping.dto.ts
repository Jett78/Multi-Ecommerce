import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateMappingDto {
  @ApiProperty({ example: 'Kathmandu' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'pathao' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  courierCityId?: number;

  @ApiPropertyOptional({ example: 'Kathmandu' })
  @IsString()
  @IsOptional()
  courierCityName?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsNumber()
  @IsOptional()
  courierAreaId?: number;

  @ApiPropertyOptional({ example: 'Baneshwor' })
  @IsString()
  @IsOptional()
  courierAreaName?: string;

  @ApiPropertyOptional({ example: 'TINKUNE' })
  @IsString()
  @IsOptional()
  courierBranch?: string;

  @ApiPropertyOptional({ example: [{ weightKg: 1, price: 150 }, { weightKg: 3, price: 220 }] })
  @IsArray()
  @IsOptional()
  deliveryChargeOverrides?: Array<{ weightKg: number; price: number }> | null;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isMapped?: boolean;
}

export class BulkUpdateMappingsDto {
  @ApiProperty({ type: [UpdateMappingDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateMappingDto)
  mappings: UpdateMappingDto[];
}
