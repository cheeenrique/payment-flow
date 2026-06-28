import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Publicado quando o prazo de um pagamento expira sem confirmação */
export class PaymentExpiredEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'payment.expired.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    chargeId: string,
  ) {
    this.payload = { chargeId };
  }
}
