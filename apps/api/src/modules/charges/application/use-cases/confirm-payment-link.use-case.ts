import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { ChargePaymentRequestedEvent } from '@/modules/charges/domain/events/charge-payment-requested.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

export interface ConfirmPaymentLinkInput {
  token: string;
  method: PaymentMethod;
}

export interface ConfirmPaymentLinkOutput {
  status: ChargeStatus;
}

/**
 * Caso de uso: confirmação do link de pagamento pelo cliente no checkout.
 * Seleciona o método de pagamento, transiciona para awaiting_payment
 * e publica charge.payment_requested.v1 para o módulo de pagamentos processar.
 */
@Injectable()
export class ConfirmPaymentLinkUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(input: ConfirmPaymentLinkInput): Promise<ConfirmPaymentLinkOutput> {
    const charge = await this.chargeRepo.findByPaymentLinkToken(input.token);

    if (charge === null) {
      throw new ChargeNotFoundError(input.token);
    }

    // Pode lançar ConflictError — entidade guarda o invariante, use-case não captura
    const updatedCharge = charge.selectMethodAndRequestPayment(input.method);

    await this.chargeRepo.update(updatedCharge);
    this.publishEvent(updatedCharge, input.method);

    return { status: updatedCharge.status };
  }

  private publishEvent(charge: Charge, method: PaymentMethod): void {
    const correlationId = randomUUID();

    this.eventBus.publish(
      new ChargePaymentRequestedEvent(charge.id, correlationId, {
        customerId: charge.customerId,
        amount: charge.amount,
        method,
      }),
    );
  }
}
