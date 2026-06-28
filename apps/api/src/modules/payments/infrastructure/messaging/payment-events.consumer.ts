import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import type { Channel, ConsumeMessage } from 'amqplib';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import { CreatePaymentUseCase } from '@/modules/payments/application/use-cases/create-payment.use-case';
import { ProcessPaymentUseCase } from '@/modules/payments/application/use-cases/process-payment.use-case';
import type { PaymentMethod } from '@/modules/payments/domain/entities/payment.entity';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import {
  RETRY_MAX_ATTEMPTS,
  getRetryCount,
  hasExceededRetryLimit,
} from '@/infra/messaging/retry-policy.helper';

/**
 * Consumer RabbitMQ do módulo Payments.
 * Único handler de 'charge.payment_requested.v1' — sem padrão compartilhado,
 * o que permite controle de ACK/NACK individual sem risco de double-ack.
 */
@Controller()
export class PaymentEventsConsumer {
  private readonly logger = new Logger(PaymentEventsConsumer.name);

  constructor(
    private readonly createPayment: CreatePaymentUseCase,
    private readonly processPayment: ProcessPaymentUseCase,
    private readonly eventBus: EventBusService,
  ) {}

  /**
   * Reage ao evento charge.payment_requested.v1.
   * Criado pelo módulo Charges quando uma cobrança precisa ser paga.
   *
   * POLÍTICA DE RETRY (x-retry-count no header AMQP):
   *   - Sucesso:                      ACK direto.
   *   - Falha, count < MAX_ATTEMPTS:  ACK + republica com count + 1.
   *   - Falha, count >= MAX_ATTEMPTS: NACK sem requeue → broker encaminha
   *                                   para 'payment-flow.dlq'.
   *
   * NestJS ServerRMQ NÃO gerencia ACK/NACK para @EventPattern — este handler
   * é inteiramente responsável pela confirmação com o broker.
   */
  @EventPattern('charge.payment_requested.v1')
  async handleChargePaymentRequested(
    @Payload() event: IntegrationEvent,
    @Ctx() ctx: RmqContext,
  ): Promise<void> {
    const channel = ctx.getChannelRef() as Channel;
    const message = ctx.getMessage() as ConsumeMessage;
    const correlationId = event.correlationId ?? randomUUID();
    const retryCount = getRetryCount(message);

    this.logger.log(
      `Evento recebido: charge.payment_requested.v1 — chargeId=${String(event.aggregateId)} ` +
        `correlationId=${correlationId} tentativa=${retryCount + 1}/${RETRY_MAX_ATTEMPTS + 1}`,
    );

    try {
      const result = await this.createPayment.execute({
        chargeId: String(event.aggregateId),
        customerId: String(event.payload['customerId'] ?? ''),
        amount: Number(event.payload['amount'] ?? 0),
        method: (event.payload['method'] as PaymentMethod) ?? 'pix',
        idempotencyKey: correlationId,
        correlationId,
      });

      // Resposta idempotente: pagamento já existia, não processar novamente
      if (result.deduplicated) {
        this.logger.warn(`Evento duplicado ignorado — paymentId=${result.paymentId}`);
        channel.ack(message);
        return;
      }

      await this.processPayment.execute(result.paymentId, correlationId);
      channel.ack(message);
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao processar charge.payment_requested.v1 — correlationId=${correlationId} tentativa=${retryCount + 1}`,
        err instanceof Error ? err.stack : String(err),
      );

      this.handleRetryOrDlq(event, message, channel, retryCount, correlationId);
    }
  }

  /**
   * Decide entre nova tentativa ou encaminhamento para DLQ.
   * Centraliza a política para que o handler acima permaneça coeso.
   */
  private handleRetryOrDlq(
    event: IntegrationEvent,
    message: ConsumeMessage,
    channel: Channel,
    retryCount: number,
    correlationId: string,
  ): void {
    if (hasExceededRetryLimit(message)) {
      this.logger.warn(
        `Limite de tentativas atingido (${retryCount}/${RETRY_MAX_ATTEMPTS}) — ` +
          `encaminhando para DLQ: correlationId=${correlationId}`,
      );
      // NACK sem requeue: broker encaminha para 'payment-flow.dlq' via dead-letter
      channel.nack(message, false, false);
    } else {
      this.logger.log(
        `Agendando retry ${retryCount + 1}/${RETRY_MAX_ATTEMPTS} — correlationId=${correlationId}`,
      );
      // ACK o original e republica com contador incrementado
      channel.ack(message);
      this.eventBus.republish(event, retryCount + 1);
    }
  }
}
