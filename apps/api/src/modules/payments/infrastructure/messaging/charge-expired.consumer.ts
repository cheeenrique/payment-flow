import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import { PaymentExpiredEvent } from '@/modules/payments/domain/events/payment-expired.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

/**
 * Consumer RabbitMQ do módulo Payments.
 * Reage ao evento charge.expired.v1 para expirar pagamentos presos.
 *
 * Contexto: quando o scheduler de cobranças expira uma charge, qualquer pagamento
 * em 'pending' ou 'processing' vinculado a ela fica em estado inconsistente.
 * Este consumer fecha o ciclo no módulo de Payments sem importar nada do módulo
 * Charges — comunicação puramente via evento (desacoplamento por contrato).
 *
 * Após expirar o pagamento, publica payment.expired.v1 que:
 *   - charges/PaymentResultConsumer → marca a charge como expirada (idempotente — já está)
 *   - timeline/TimelineConsumer → registra o evento na projeção histórica
 *
 * Padrão compartilhado: charge.expired.v1 também é consumido por timeline e
 * notifications, portanto este handler NÃO faz ACK/NACK manual.
 */
@Controller()
export class ChargeExpiredConsumer {
  private readonly logger = new Logger(ChargeExpiredConsumer.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  /**
   * Recebe charge.expired.v1 e expira o pagamento ativo associado, se existir.
   * aggregateId do evento = chargeId da cobrança expirada.
   */
  @EventPattern('charge.expired.v1')
  async handleChargeExpired(@Payload() event: IntegrationEvent): Promise<void> {
    const chargeId = event.aggregateId;
    const correlationId = event.correlationId ?? randomUUID();

    this.logger.log(
      `Cobrança expirada recebida — expirando pagamento ativo: chargeId=${chargeId} correlationId=${correlationId}`,
    );

    try {
      const payment = await this.repo.findActiveByChargeId(chargeId);

      if (!payment) {
        // Situação normal: boleto nunca gerou pagamento, ou já foi resolvido
        this.logger.debug(
          `Nenhum pagamento ativo encontrado para cobrança expirada: chargeId=${chargeId}`,
        );
        return;
      }

      // Idempotência: payment.expire() lança ConflictError se já for terminal
      if (payment.isTerminal()) {
        this.logger.warn(
          `Pagamento já terminal — ignorando expiração: paymentId=${payment.id} status="${payment.status}"`,
        );
        return;
      }

      const expired = payment.expire();
      await this.repo.update(expired);

      this.eventBus.publish(
        new PaymentExpiredEvent(expired.id, correlationId, chargeId),
      );

      this.sseService.emit({
        type: 'payment.expired',
        data: { paymentId: expired.id, chargeId, status: 'expired' },
      });

      this.logger.log(
        `Pagamento expirado via charge.expired.v1: paymentId=${expired.id} chargeId=${chargeId}`,
      );
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao expirar pagamento para cobrança expirada: chargeId=${chargeId} correlationId=${correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }
}
