import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado no RabbitMQ quando um novo cliente é criado */
export class CustomerCreatedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'customer.created.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    name: string,
    email: string,
    document: string,
    phone?: string,
  ) {
    this.payload = { name, email, document, phone };
  }
}
