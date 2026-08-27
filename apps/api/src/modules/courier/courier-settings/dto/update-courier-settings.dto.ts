import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCourierSettingsDto {
  @ApiProperty({ example: 'Pathao Courier' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://courier-api-sandbox.pathao.com' })
  @IsString()
  @IsNotEmpty()
  apiBaseUrl: string;

  @ApiProperty({ example: '{"clientId":"xxx","clientSecret":"xxx","username":"xxx","password":"xxx"}' })
  @IsString()
  @IsNotEmpty()
  credentials: string;

  @ApiPropertyOptional({ example: '{"storeId":"12345"}' })
  @IsString()
  @IsOptional()
  config?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
