import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento publicado quando o simulador determina que uma cobrança expirou sem pagamento.
 * Cenário típico: boleto não pago dentro do prazo simulado.
 * Routing key: simulator.charge.expired.v1
 */
export class ChargeExpiredEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.charge.expired.v1';
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
