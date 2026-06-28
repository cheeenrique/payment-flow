import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Veredito de aprovação emitido pelo simulador após o delay configurado.
 * Routing key: simulator.payment.approved.v1
 *
 * O campo aggregateId carrega o paymentId — permite que o módulo Payments
 * localize e transite o pagamento sem precisar de lookup extra.
 */
export class SimulatorPaymentApprovedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.payment.approved.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID do pagamento aprovado */
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
