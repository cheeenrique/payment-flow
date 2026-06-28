import { IsEnum, IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

/** Métodos de pagamento aceitos pela API */
export const PAYMENT_METHODS = ['pix', 'boleto', 'credit_card'] as const;
type PaymentMethodValue = (typeof PAYMENT_METHODS)[number];

/**
 * DTO para criação manual de um pagamento via POST /payments.
 * Validação ocorre na borda — domínio recebe dados já limpos.
 */
export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  chargeId!: string;

  @IsString()
  @IsNotEmpty()
  customerId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsEnum(PAYMENT_METHODS, {
    message: `method deve ser um de: ${PAYMENT_METHODS.join(', ')}`,
  })
  method!: PaymentMethodValue;
}
