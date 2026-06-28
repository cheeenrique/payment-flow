import { Inject, Injectable } from '@nestjs/common';
import { PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/** Vista pública de uma cobrança — nunca expõe IDs internos, tokens ou customerId */
export interface PublicChargeView {
  amount: number;
  currency: string;
  description?: string;
  status: string;
  availableMethods: PaymentMethod[];
  customerName?: string;
}

/** Métodos de pagamento disponíveis para o checkout público */
const SUPPORTED_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.PIX,
  PaymentMethod.BOLETO,
  PaymentMethod.CREDIT_CARD,
];

/**
 * Caso de uso: retorna a vista pública de uma cobrança pelo token do link de pagamento.
 * Consumido pelo checkout público — nunca retorna campos sensíveis.
 */
@Injectable()
export class GetChargeByTokenUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
  ) {}

  async execute(token: string): Promise<PublicChargeView> {
    const charge = await this.chargeRepo.findByPaymentLinkToken(token);

    if (!charge) {
      throw new ChargeNotFoundError(token);
    }

    return {
      amount: charge.amount,
      currency: charge.currency,
      description: charge.description,
      status: charge.status,
      availableMethods: SUPPORTED_PAYMENT_METHODS,
    };
  }
}
