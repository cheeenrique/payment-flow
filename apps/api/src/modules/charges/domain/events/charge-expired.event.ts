import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento de integração emitido quando uma cobrança expira.
 * Consumido por: Timeline, Notifications, Dashboard (via SSE).
 */
export class ChargeExpiredEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'charge.expired.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    customerId: string,
  ) {
    this.payload = { customerId };
  }
}
