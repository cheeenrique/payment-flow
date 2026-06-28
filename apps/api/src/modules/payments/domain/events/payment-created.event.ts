import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import type { PaymentMethod } from '@/modules/payments/domain/entities/payment.entity';

/** Publicado quando um pagamento é criado com status "pending" */
export class PaymentCreatedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'payment.created.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    chargeId: string,
    customerId: string,
    amount: number,
    method: PaymentMethod,
  ) {
    this.payload = { chargeId, customerId, amount, method };
  }
}
