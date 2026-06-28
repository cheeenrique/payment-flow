import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Razão da recusa simulada pelo PSP adquirente.
 * Permite que consumidores downstream diferenciem o tipo de falha.
 */
export type FailureReason =
  | 'insufficient_funds'   // saldo insuficiente (cartão)
  | 'card_declined'        // recusa genérica da adquirente
  | 'intermittent_failure'; // falha intermitente (PIX / instabilidade)

/**
 * Evento de integração publicado quando o simulador recusa um pagamento.
 * Routing key: simulator.payment.force_failure.v1
 */
export class PaymentForceFailureEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.payment.force_failure.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentMethod: string,
    reason: FailureReason,
  ) {
    this.payload = {
      paymentMethod,
      reason,
      simulatedAt: this.timestamp.toISOString(),
    };
  }
}
