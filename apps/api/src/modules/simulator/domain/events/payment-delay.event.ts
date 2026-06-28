import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento de integração publicado quando o simulador anuncia um delay de processamento.
 * Permite que o frontend e outros módulos exibam o status "em processamento".
 * Routing key: simulator.payment.delay.v1
 */
export class PaymentDelayEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.payment.delay.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentMethod: string,
    delayMs: number,
  ) {
    this.payload = {
      paymentMethod,
      delayMs,
      simulatedAt: this.timestamp.toISOString(),
    };
  }
}
