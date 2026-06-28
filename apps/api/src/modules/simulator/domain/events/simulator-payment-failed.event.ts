import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Razões de recusa reconhecidas pelo simulador de PSP.
 * Permite que consumidores downstream diferenciem o tipo de falha
 * e tomem decisões específicas (ex.: boleto expirado vs cartão sem saldo).
 */
export type SimulatorFailureReason =
  | 'insufficient_funds'    // saldo insuficiente (cartão de crédito)
  | 'card_declined'         // recusa genérica da adquirente
  | 'intermittent_failure'  // falha intermitente (PIX / instabilidade de rede)
  | 'system_error'          // erro sistêmico do PSP (timeout, indisponibilidade)
  | 'expired';              // prazo expirado sem compensação (boleto)

/**
 * Veredito de recusa emitido pelo simulador após o delay configurado.
 * Routing key: simulator.payment.failed.v1
 *
 * O campo aggregateId carrega o paymentId para rastreabilidade end-to-end.
 */
export class SimulatorPaymentFailedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.payment.failed.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID do pagamento recusado */
    readonly aggregateId: string,
    readonly correlationId: string,
    paymentMethod: string,
    reason: SimulatorFailureReason,
  ) {
    this.payload = {
      paymentMethod,
      reason,
      simulatedAt: this.timestamp.toISOString(),
    };
  }
}
