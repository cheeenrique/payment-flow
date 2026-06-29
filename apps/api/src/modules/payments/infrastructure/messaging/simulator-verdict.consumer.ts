import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import { PaymentApprovedEvent } from '@/modules/payments/domain/events/payment-approved.event';
import { PaymentFailedEvent } from '@/modules/payments/domain/events/payment-failed.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

/**
 * Consumer RabbitMQ que recebe os vereditos do simulador (PSP artificial)
 * e transiciona o pagamento para o estado final correspondente.
 *
 * Padrão compartilhado: simulator.payment.approved/failed.v1 podem ser
 * consumidos por outros módulos (timeline, etc.). Por isso, este handler:
 *   - NÃO faz ACK/NACK manual (evita double-ack)
 *   - Captura erros internamente sem relançar
 *   - É idempotente: ignora vereditos se o pagamento não está em "processing"
 */
@Controller()
export class SimulatorVerdictConsumer {
  private readonly logger = new Logger(SimulatorVerdictConsumer.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  /**
   * Recebe aprovação do simulador e transiciona o pagamento para "approved".
   * Publica payment.approved.v1 com payload { chargeId, customerId, amount }
   * — contrato esperado por invoices, notifications e charges.
   */
  @EventPattern('simulator.payment.approved.v1')
  async handleApproved(@Payload() event: IntegrationEvent): Promise<void> {
    const paymentId = event.aggregateId;
    const correlationId = event.correlationId;

    this.logger.log(
      `Veredito de aprovação recebido: paymentId=${paymentId} correlationId=${correlationId}`,
    );

    try {
      const payment = await this.repo.findById(paymentId);

      if (!payment) {
        this.logger.warn(`Pagamento não encontrado para veredito de aprovação: paymentId=${paymentId}`);
        return;
      }

      // Idempotência: ignora se já saiu de "processing"
      if (payment.status !== 'processing') {
        this.logger.warn(
          `Veredito de aprovação ignorado — paymentId=${paymentId} status atual="${payment.status}"`,
        );
        return;
      }

      const providerResponse = { simulatedAt: event.payload['simulatedAt'] as string };
      const approved = payment.approve(providerResponse);
      await this.repo.update(approved);

      // Payload obrigatório: { chargeId, customerId, amount } — contrato do invoices consumer
      this.eventBus.publish(
        new PaymentApprovedEvent(approved.id, correlationId, approved.chargeId, approved.customerId, approved.amount),
      );

      this.sseService.emit({
        type: 'payment.approved',
        data: {
          id: approved.id,
          paymentId: approved.id,
          chargeId: approved.chargeId,
          customerId: approved.customerId,
          amount: approved.amount,
          method: approved.method,
          status: 'approved',
        },
      });

      this.logger.log(`Pagamento aprovado: paymentId=${approved.id} chargeId=${approved.chargeId}`);
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao processar aprovação do simulador — paymentId=${paymentId} correlationId=${correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }

  /**
   * Recebe recusa do simulador e transiciona o pagamento para "failed".
   * Publica payment.failed.v1 com a razão de recusa para diagnóstico.
   */
  @EventPattern('simulator.payment.failed.v1')
  async handleFailed(@Payload() event: IntegrationEvent): Promise<void> {
    const paymentId = event.aggregateId;
    const correlationId = event.correlationId;
    const reason = String(event.payload['reason'] ?? 'Pagamento recusado pelo processador simulado');

    this.logger.log(
      `Veredito de recusa recebido: paymentId=${paymentId} reason=${reason} correlationId=${correlationId}`,
    );

    try {
      const payment = await this.repo.findById(paymentId);

      if (!payment) {
        this.logger.warn(`Pagamento não encontrado para veredito de recusa: paymentId=${paymentId}`);
        return;
      }

      // Idempotência: ignora se já saiu de "processing"
      if (payment.status !== 'processing') {
        this.logger.warn(
          `Veredito de recusa ignorado — paymentId=${paymentId} status atual="${payment.status}"`,
        );
        return;
      }

      const providerResponse = {
        simulatedAt: event.payload['simulatedAt'] as string,
        reason: event.payload['reason'],
      };
      const failed = payment.fail(reason, providerResponse);
      await this.repo.update(failed);

      this.eventBus.publish(
        new PaymentFailedEvent(failed.id, correlationId, failed.chargeId, reason),
      );

      this.sseService.emit({
        type: 'payment.failed',
        data: {
          id: failed.id,
          paymentId: failed.id,
          chargeId: failed.chargeId,
          customerId: failed.customerId,
          amount: failed.amount,
          method: failed.method,
          status: 'failed',
          reason,
        },
      });

      this.logger.log(`Pagamento recusado: paymentId=${failed.id} reason=${reason}`);
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao processar recusa do simulador — paymentId=${paymentId} correlationId=${correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }
}
