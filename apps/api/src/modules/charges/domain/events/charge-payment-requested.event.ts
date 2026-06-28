import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento emitido quando o fluxo de pagamento é solicitado para uma cobrança.
 * Consumido pelo Payments module para iniciar o processamento.
 */
export class ChargePaymentRequestedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'charge.payment_requested.v1';
  readonly timestamp = new Date();

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    readonly payload: Record<string, unknown>,
  ) {}
}
