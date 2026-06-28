import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';

/** DTO de entrada para criação de cobrança via POST /charges */
export class CreateChargeDto {
  /** ID do cliente associado à cobrança */
  @IsString()
  @IsNotEmpty()
  customerId!: string;

  /** Valor da cobrança (positivo, maior que zero) */
  @IsNumber()
  @IsPositive()
  amount!: number;

  /** Método de pagamento selecionado */
  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  /** Descrição opcional da cobrança */
  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;

  /** Data/hora de expiração no formato ISO 8601 */
  @IsDateString()
  expiresAt!: string;
}
