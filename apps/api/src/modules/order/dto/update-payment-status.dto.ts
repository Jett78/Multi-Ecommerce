import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'completed', 'failed', 'refunded', 'expired', 'cancelled'])
  paymentStatus: string;

  @IsString()
  @IsOptional()
  transactionId?: string;
}
