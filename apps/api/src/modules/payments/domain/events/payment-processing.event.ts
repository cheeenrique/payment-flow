import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import type { PaymentMethod } from '@/modules/payments/domain/entities/payment.entity';

/**
 * Publicado quando o processamento do pagamento é iniciado (status → processing).
 *
 * O payload carrega todos os dados necessários para que o simulador (PSP artificial)
 * possa tomar a decisão de aprovação sem realizar lookup adicional no banco.
 * Inclui: chargeId, customerId, amount e method — além do paymentId (aggregateId) e
 * correlationId que ficam no envelope da interface IntegrationEvent.
 */
export class PaymentProcessingEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'payment.processing.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    /** ID do pagamento (aggregateId) */
    readonly aggregateId: string,
    readonly correlationId: string,
    chargeId: string,
    customerId: string,
    amount: number,
    method: PaymentMethod,
  ) {
    this.payload = { chargeId, customerId, amount, method, status: 'processing' };
  }
}
