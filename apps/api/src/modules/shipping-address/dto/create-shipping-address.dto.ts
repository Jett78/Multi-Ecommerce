import { IsString, IsInt, IsOptional, IsBoolean, IsIn, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingAddressDto {
  @ApiPropertyOptional({ description: 'Address type', enum: ['home', 'office', 'other'], example: 'home' })
  @IsOptional()
  @IsIn(['home', 'office', 'other'])
  type?: 'home' | 'office' | 'other';

  @ApiPropertyOptional({ description: 'Optional label for the address', example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiProperty({ description: 'Province ID', example: 3 })
  @IsInt()
  provinceId: number;

  @ApiProperty({ description: 'Province name', example: 'Madhesh Province' })
  @IsString()
  @IsNotEmpty()
  provinceName: string;

  @ApiProperty({ description: 'District name', example: 'Kathmandu' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ description: 'Municipality / Rural Municipality', example: 'Kathmandu Metropolitan City' })
  @IsString()
  @IsNotEmpty()
  municipality: string;

  @ApiPropertyOptional({ description: 'Landmark', example: 'Near City Mall' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ description: 'Street address', example: 'Ward 5, Thamel' })
  @IsString()
  @IsNotEmpty()
  streetAddress: string;

  @ApiPropertyOptional({ description: 'Set as default address', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
