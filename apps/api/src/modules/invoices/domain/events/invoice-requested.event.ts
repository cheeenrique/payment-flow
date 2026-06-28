import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado quando uma emissão de nota fiscal é solicitada */
export class InvoiceRequestedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'invoice.requested.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID da invoice criada */
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentId: string,
    chargeId: string,
    customerId: string,
    amount: number,
  ) {
    this.payload = { paymentId, chargeId, customerId, amount };
  }
}
