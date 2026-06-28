import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado no RabbitMQ quando dados de um cliente são atualizados */
export class CustomerUpdatedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'customer.updated.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    name: string,
    document: string,
    phone?: string,
  ) {
    this.payload = { name, document, phone };
  }
}
