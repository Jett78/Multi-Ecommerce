import { IsString, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'Variant UUID' })
  @IsUUID()
  variantId: string;

  @ApiProperty({ example: 1, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}
