import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento de integração publicado quando o simulador aprova um pagamento.
 * Routing key: simulator.payment.force_success.v1
 */
export class PaymentForceSuccessEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.payment.force_success.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentMethod: string,
  ) {
    this.payload = {
      paymentMethod,
      simulatedAt: this.timestamp.toISOString(),
    };
  }
}
