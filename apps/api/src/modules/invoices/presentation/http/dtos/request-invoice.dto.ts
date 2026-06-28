import { IsNumber, IsString, Min } from 'class-validator';

/** DTO para solicitação manual de emissão de nota fiscal via REST */
export class RequestInvoiceDto {
  @IsString()
  paymentId!: string;

  @IsString()
  chargeId!: string;

  @IsString()
  customerId!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;
}
