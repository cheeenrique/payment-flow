import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado quando a emissão de nota fiscal falha (erro fiscal simulado) */
export class InvoiceFailedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'invoice.failed.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID da invoice com falha */
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentId: string,
  ) {
    this.payload = { paymentId };
  }
}
