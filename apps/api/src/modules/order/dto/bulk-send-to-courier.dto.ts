import { IsArray, IsString, ArrayMaxSize, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkSendToCourierDto {
  @ApiProperty({
    description: 'List of order UUIDs to dispatch to the courier',
    type: [String],
    maxItems: 200,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  orderIds: string[];
}
