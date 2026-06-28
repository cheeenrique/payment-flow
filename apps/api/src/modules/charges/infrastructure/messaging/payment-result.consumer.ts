import { Controller, Inject, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import type { Charge } from '@/modules/charges/domain/entities/charge.entity';
import { ChargeUpdatedEvent } from '@/modules/charges/domain/events/charge-updated.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/** Status alvo possível para uma transição disparada por resultado de pagamento */
type PaymentResultStatus = 'paid' | 'failed' | 'expired';

/**
 * Consumer RabbitMQ que fecha o ciclo da cobrança com base no resultado do pagamento.
 *
 * Escuta os eventos de desfecho publicados pelo módulo Payments e transiciona
 * o status da cobrança de forma idempotente:
 *   payment.approved.v1 → charge "paid"
 *   payment.failed.v1   → charge "failed"
 *   payment.expired.v1  → charge "expired"
 *
 * Padrão compartilhado: payment.approved/failed.v1 são consumidos por invoices,
 * notifications e timeline. Por isso, este handler:
 *   - NÃO faz ACK/NACK manual (evita double-ack com handlers encadeados)
 *   - Captura erros internamente sem relançar
 *   - Ignora cobranças já em estado terminal (idempotente)
 */
@Controller()
export class PaymentResultConsumer {
  private readonly logger = new Logger(PaymentResultConsumer.name);

  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly repo: IChargeRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  /** Pagamento aprovado → cobrança paga */
  @EventPattern('payment.approved.v1')
  async handleApproved(@Payload() event: IntegrationEvent): Promise<void> {
    const chargeId = String(event.payload['chargeId'] ?? '');
    await this.applyTransition(chargeId, event, 'paid');
  }

  /** Pagamento recusado → cobrança falhou */
  @EventPattern('payment.failed.v1')
  async handleFailed(@Payload() event: IntegrationEvent): Promise<void> {
    const chargeId = String(event.payload['chargeId'] ?? '');
    await this.applyTransition(chargeId, event, 'failed');
  }

  /** Pagamento expirado (boleto sem compensação) → cobrança expirada */
  @EventPattern('payment.expired.v1')
  async handleExpired(@Payload() event: IntegrationEvent): Promise<void> {
    const chargeId = String(event.payload['chargeId'] ?? '');
    await this.applyTransition(chargeId, event, 'expired');
  }

  /**
   * Aplica a transição de estado na cobrança de forma idempotente.
   * Cobranças já em estado terminal são ignoradas silenciosamente.
   */
  private async applyTransition(
    chargeId: string,
    event: IntegrationEvent,
    targetStatus: PaymentResultStatus,
  ): Promise<void> {
    if (!chargeId) {
      this.logger.warn(
        `Evento ${event.type} sem chargeId válido — correlationId=${event.correlationId}`,
      );
      return;
    }

    this.logger.log(
      `Resultado de pagamento recebido: chargeId=${chargeId} targetStatus=${targetStatus} ` +
        `correlationId=${event.correlationId}`,
    );

    try {
      const charge = await this.repo.findById(chargeId);

      if (!charge) {
        this.logger.warn(`Cobrança não encontrada para resultado de pagamento: chargeId=${chargeId}`);
        return;
      }

      // Idempotência: ignora cobranças já em estado terminal
      if (charge.isTerminal()) {
        this.logger.warn(
          `Resultado de pagamento ignorado — chargeId=${chargeId} status atual="${charge.status}"`,
        );
        return;
      }

      const updated = this.transitionCharge(charge, targetStatus);
      await this.repo.update(updated);

      this.eventBus.publish(
        new ChargeUpdatedEvent(updated.id, event.correlationId, {
          status: updated.status,
          previousStatus: charge.status,
          triggeredBy: event.type,
        }),
      );

      this.sseService.emit({
        type: 'charge.updated',
        data: { chargeId: updated.id, status: updated.status, customerId: updated.customerId },
      });

      this.logger.log(
        `Cobrança atualizada: chargeId=${updated.id} "${charge.status}" → "${updated.status}"`,
      );
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao atualizar cobrança ${chargeId} via evento ${event.type}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }

  /** Delega para o método correto da entidade conforme o targetStatus */
  private transitionCharge(charge: Charge, targetStatus: PaymentResultStatus): Charge {
    if (targetStatus === 'paid') return charge.markAsPaid();
    if (targetStatus === 'failed') return charge.markAsFailed();
    return charge.markAsExpired();
  }
}
