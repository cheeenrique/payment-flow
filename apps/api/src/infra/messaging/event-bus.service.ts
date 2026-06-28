import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RmqRecordBuilder } from '@nestjs/microservices';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import { EVENT_BUS } from './messaging.tokens';

/**
 * Publisher que desacopla os módulos de domínio do transporte RabbitMQ.
 * Módulos dependem deste serviço — nunca do ClientProxy diretamente.
 */
@Injectable()
export class EventBusService {
  private readonly logger = new Logger(EventBusService.name);

  constructor(
    @Inject(EVENT_BUS)
    private readonly client: ClientProxy,
  ) {}

  /** Publica um evento de integração na fila principal. */
  publish(event: IntegrationEvent): void {
    this.client.emit(event.type, event).subscribe({
      error: (err: unknown) => {
        this.logger.error(
          `Falha ao publicar evento [${event.type}] correlationId=${event.correlationId}`,
          err instanceof Error ? err.stack : String(err),
        );
      },
    });
  }

  /**
   * Republica um evento com o contador de retentativa incrementado.
   *
   * Usado pelos consumers para agendar nova tentativa de processamento
   * sem requeue direto no broker — preserva o contexto de retry no header
   * AMQP `x-retry-count`, que é lido pelo retry-policy.helper.
   *
   * O ACK da mensagem original deve ser chamado pelo consumer antes de
   * invocar este método para garantir at-most-once por tentativa.
   */
  republish(event: IntegrationEvent, retryCount: number): void {
    const record = new RmqRecordBuilder(event)
      .setOptions({ headers: { 'x-retry-count': String(retryCount) } })
      .build();

    this.client.emit(event.type, record).subscribe({
      error: (err: unknown) => {
        this.logger.error(
          `Falha ao republicar evento [${event.type}] correlationId=${event.correlationId} tentativa=${retryCount}`,
          err instanceof Error ? err.stack : String(err),
        );
      },
    });
  }
}
