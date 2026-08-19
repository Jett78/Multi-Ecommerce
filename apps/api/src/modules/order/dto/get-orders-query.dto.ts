import { IsString, IsOptional, IsIn } from 'class-validator';

export class GetOrdersQueryDto {
  @IsString()
  @IsOptional()
  page?: string;

  @IsString()
  @IsOptional()
  limit?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['khalti', 'cod', 'stripe'])
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  @IsIn(['pending', 'completed', 'failed', 'refunded', 'expired', 'cancelled'])
  paymentStatus?: string;
}
