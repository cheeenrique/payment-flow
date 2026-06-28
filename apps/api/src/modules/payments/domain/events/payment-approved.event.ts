import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Publicado quando um pagamento é aprovado.
 * Consumido por: invoices (geração de NF), notifications, timeline.
 */
export class PaymentApprovedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'payment.approved.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    chargeId: string,
    customerId: string,
    amount: number,
  ) {
    this.payload = { chargeId, customerId, amount };
  }
}
