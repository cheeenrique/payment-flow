import { IsEnum } from 'class-validator';
import { PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';

/** DTO de entrada para confirmação do link de pagamento via POST /pay/:token/confirm */
export class ConfirmPaymentDto {
  /** Método de pagamento escolhido pelo cliente no checkout */
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;
}
