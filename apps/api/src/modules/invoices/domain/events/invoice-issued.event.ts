import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado quando a nota fiscal é emitida com sucesso */
export class InvoiceIssuedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'invoice.issued.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID da invoice emitida */
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentId: string,
    externalReference: string,
    issuedAt: Date,
  ) {
    this.payload = { paymentId, externalReference, issuedAt };
  }
}
