import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Publicado quando um pagamento é recusado pelo processador */
export class PaymentFailedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'payment.failed.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    chargeId: string,
    failureReason: string,
  ) {
    this.payload = { chargeId, failureReason };
  }
}
