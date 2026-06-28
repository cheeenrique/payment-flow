import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import { RecordEventUseCase } from '@/modules/timeline/application/use-cases/record-event.use-case';
import type { AggregateType } from '@/modules/timeline/domain/entities/timeline-event.entity';
import { SseService } from '@/infra/sse/sse.service';

/**
 * Consumer RabbitMQ da timeline.
 * Consome TODOS os domain events do sistema e registra na projeção.
 * Cada handler delega para processEvent — método central da classe.
 */
@Controller()
export class TimelineConsumer {
  private readonly logger = new Logger(TimelineConsumer.name);

  constructor(
    private readonly recordEvent: RecordEventUseCase,
    private readonly sse: SseService,
  ) {}

  // ── Charge events ──────────────────────────────────────────

  @EventPattern('charge.created.v1')
  handleChargeCreated(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'charge');
  }

  @EventPattern('charge.updated.v1')
  handleChargeUpdated(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'charge');
  }

  @EventPattern('charge.canceled.v1')
  handleChargeCanceled(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'charge');
  }

  @EventPattern('charge.expired.v1')
  handleChargeExpired(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'charge');
  }

  // ── Payment events ─────────────────────────────────────────

  @EventPattern('payment.created.v1')
  handlePaymentCreated(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'payment');
  }

  @EventPattern('payment.processing.v1')
  handlePaymentProcessing(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'payment');
  }

  @EventPattern('payment.approved.v1')
  handlePaymentApproved(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'payment');
  }

  @EventPattern('payment.failed.v1')
  handlePaymentFailed(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'payment');
  }

  // ── Invoice events ─────────────────────────────────────────

  @EventPattern('invoice.requested.v1')
  handleInvoiceRequested(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'invoice');
  }

  @EventPattern('invoice.issued.v1')
  handleInvoiceIssued(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'invoice');
  }

  @EventPattern('invoice.failed.v1')
  handleInvoiceFailed(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'invoice');
  }

  // ── Notification events ────────────────────────────────────

  @EventPattern('notification.created.v1')
  handleNotificationCreated(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'notification');
  }

  // ── Auth / System events ───────────────────────────────────

  @EventPattern('auth.user.logged_in.v1')
  handleUserLoggedIn(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'system');
  }

  @EventPattern('system.retry.executed.v1')
  handleRetryExecuted(@Payload() event: IntegrationEvent): Promise<void> {
    return this.processEvent(event, 'system');
  }

  /**
   * Ponto central de processamento: persiste o evento e notifica o frontend via SSE.
   *
   * Erros são capturados internamente — este consumer NÃO relança exceções.
   * Motivo: os padrões são compartilhados com outros handlers (notification, simulator).
   * Como o NestJS passa o mesmo RmqContext (mesmo message/channel) para todos os
   * handlers encadeados de um mesmo @EventPattern, ACK/NACK individual causaria
   * double-ack. A estratégia para padrões compartilhados é capturar erros, logar
   * e retornar normalmente — mensagens ficam unacked e são reenviadas no reconect
   * (aceito pois os handlers são idempotentes).
   *
   * Duplicatas são absorvidas silenciosamente pelo repositório.
   */
  private async processEvent(
    event: IntegrationEvent,
    aggregateType: AggregateType,
  ): Promise<void> {
    try {
      // Datas chegam como string após deserialização JSON do RabbitMQ
      const timestamp =
        event.timestamp instanceof Date
          ? event.timestamp
          : new Date(String(event.timestamp));

      await this.recordEvent.execute({
        sourceEventId: event.id,
        eventType: event.type,
        aggregateId: event.aggregateId,
        aggregateType,
        payload: event.payload,
        correlationId: event.correlationId,
        timestamp,
      });

      this.sse.emit({
        type: 'timeline.event.recorded',
        data: {
          eventType: event.type,
          aggregateId: event.aggregateId,
          aggregateType,
          correlationId: event.correlationId,
        },
      });
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao registrar evento ${event.type} na timeline — aggregateId=${event.aggregateId} correlationId=${event.correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }
}
