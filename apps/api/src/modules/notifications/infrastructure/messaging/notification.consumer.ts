import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import { CreateNotificationUseCase } from '@/modules/notifications/application/use-cases/create-notification.use-case';
import type { NotificationType } from '@/modules/notifications/domain/entities/notification.entity';

/** Estrutura do mapeamento evento → notificação */
interface EventMapping {
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Mapeamento estático de eventos de integração para metadados de notificação.
 *
 * Quando chega um evento do RabbitMQ, este mapa define o tipo,
 * título e mensagem padrão da notificação gerada.
 */
const EVENT_NOTIFICATION_MAP: Readonly<Record<string, EventMapping>> = {
  'charge.created.v1': {
    type: 'info',
    title: 'Cobrança criada',
    message: 'Uma nova cobrança foi criada no sistema.',
  },
  'charge.expired.v1': {
    type: 'warning',
    title: 'Cobrança expirada',
    message: 'Uma cobrança expirou sem pagamento.',
  },
  'payment.approved.v1': {
    type: 'success',
    title: 'Pagamento aprovado',
    message: 'O pagamento foi processado com sucesso.',
  },
  'payment.failed.v1': {
    type: 'error',
    title: 'Falha no pagamento',
    message: 'O pagamento não pôde ser processado.',
  },
  'payment.expiring_soon.v1': {
    type: 'warning',
    title: 'Pagamento prestes a expirar',
    message: 'Um pagamento está próximo de vencer.',
  },
  'invoice.issued.v1': {
    type: 'success',
    title: 'Nota fiscal emitida',
    message: 'A nota fiscal foi emitida com sucesso.',
  },
  'invoice.failed.v1': {
    type: 'error',
    title: 'Falha na emissão da nota fiscal',
    message: 'Não foi possível emitir a nota fiscal.',
  },
  'invoice.requested.v1': {
    type: 'info',
    title: 'Nota fiscal solicitada',
    message: 'A emissão de nota fiscal foi solicitada.',
  },
};

/**
 * Consumer de eventos de domínio via RabbitMQ.
 *
 * Cada @EventPattern corresponde a um routing key publicado por outros módulos.
 * O handler privado handleEvent centraliza a lógica de mapeamento e criação.
 *
 * Erros são capturados internamente e nunca relançados: o padrão é compartilhado
 * com timeline e outros handlers (mesmo RmqContext por mensagem), então ACK/NACK
 * manual causaria double-ack. Mensagens ficam unacked e são reenviadas no reconect
 * — aceito pois os handlers são idempotentes.
 */
@Controller()
export class NotificationConsumer {
  private readonly logger = new Logger(NotificationConsumer.name);

  constructor(
    private readonly createNotification: CreateNotificationUseCase,
  ) {}

  @EventPattern('charge.created.v1')
  async handleChargeCreated(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('charge.expired.v1')
  async handleChargeExpired(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('payment.approved.v1')
  async handlePaymentApproved(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('payment.failed.v1')
  async handlePaymentFailed(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('payment.expiring_soon.v1')
  async handlePaymentExpiringSoon(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('invoice.issued.v1')
  async handleInvoiceIssued(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('invoice.failed.v1')
  async handleInvoiceFailed(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  @EventPattern('invoice.requested.v1')
  async handleInvoiceRequested(
    @Payload() event: IntegrationEvent,
  ): Promise<void> {
    await this.handleEvent(event);
  }

  /** Processa o evento, cria notificação e garante que erros não vazem para o broker */
  private async handleEvent(event: IntegrationEvent): Promise<void> {
    const mapping = EVENT_NOTIFICATION_MAP[event.type];

    if (!mapping) {
      this.logger.warn(`Evento sem mapeamento de notificação: ${event.type}`);
      return;
    }

    try {
      await this.createNotification.execute({
        type: mapping.type,
        eventType: event.type,
        title: mapping.title,
        message: mapping.message,
        customerId:
          typeof event.payload['customerId'] === 'string'
            ? event.payload['customerId']
            : undefined,
      });

      this.logger.log(
        `Notificação criada — evento=${event.type} correlationId=${event.correlationId}`,
      );
    } catch (err) {
      this.logger.error(
        `Erro ao processar notificação para evento [${event.type}] correlationId=${event.correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }
}
