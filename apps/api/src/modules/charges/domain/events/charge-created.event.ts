import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/** Payload publicado junto ao evento charge.created.v1 */
interface ChargeCreatedPayload {
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  status: string;
  expiresAt: Date;
}

/**
 * Evento de integração emitido quando uma cobrança é criada.
 * Consumido por: Payments, Timeline, Notifications.
 */
export class ChargeCreatedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'charge.created.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    data: ChargeCreatedPayload,
  ) {
    this.payload = data as unknown as Record<string, unknown>;
  }
}
