import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado quando o processamento fiscal da invoice é iniciado */
export class InvoiceProcessingEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'invoice.processing.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID da invoice em processamento */
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentId: string,
  ) {
    this.payload = { paymentId };
  }
}
