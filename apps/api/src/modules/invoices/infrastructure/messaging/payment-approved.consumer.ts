import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import { CreateInvoiceUseCase } from '@/modules/invoices/application/use-cases/create-invoice.use-case';

/** Campos esperados no payload do evento payment.approved.v1 */
interface PaymentApprovedPayload {
  chargeId: string;
  customerId: string;
  amount: number;
}

/**
 * Consumer RabbitMQ para o evento payment.approved.v1.
 * Inicia o ciclo de emissão de nota fiscal para cada pagamento aprovado.
 *
 * Idempotente: invoices já emitidas ou em andamento são ignoradas silenciosamente.
 *
 * O padrão 'payment.approved.v1' é compartilhado com timeline e notification:
 * o mesmo RmqContext (message/channel) é passado para todos os handlers encadeados.
 * Por isso, erros são capturados e logados — sem relançar e sem ACK/NACK manual
 * (evita double-ack). Mensagens ficam unacked e são reenviadas no reconect.
 */
@Controller()
export class PaymentApprovedConsumer {
  private readonly logger = new Logger(PaymentApprovedConsumer.name);

  constructor(private readonly createInvoice: CreateInvoiceUseCase) {}

  @EventPattern('payment.approved.v1')
  async handle(@Payload() event: IntegrationEvent): Promise<void> {
    const payload = event.payload as unknown as PaymentApprovedPayload;

    this.logger.log(
      `Recebido payment.approved: paymentId=${event.aggregateId} correlationId=${event.correlationId}`,
    );

    try {
      await this.createInvoice.execute({
        paymentId: event.aggregateId,
        chargeId: payload.chargeId,
        customerId: payload.customerId,
        amount: payload.amount,
        correlationId: event.correlationId,
      });
    } catch (err: unknown) {
      // ConflictError é esperado em re-entrega (at-least-once): apenas loga
      this.logger.error(
        `Falha ao processar payment.approved para paymentId=${event.aggregateId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
