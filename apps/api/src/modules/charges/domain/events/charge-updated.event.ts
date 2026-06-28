import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento de integração genérico para atualizações de estado da cobrança.
 * Usado quando a transição não tem evento específico (ex: paid via Payments module).
 */
export class ChargeUpdatedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'charge.updated.v1';
  readonly timestamp = new Date();

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    readonly payload: Record<string, unknown>,
  ) {}
}
