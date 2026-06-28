import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Evento publicado no RabbitMQ quando um cliente é desativado (soft delete) */
export class CustomerDeactivatedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'customer.deactivated.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
  ) {
    this.payload = { customerId: aggregateId };
  }
}
