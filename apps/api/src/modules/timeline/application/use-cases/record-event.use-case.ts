import { Inject, Injectable, Logger } from '@nestjs/common';
import { TimelineEvent, AggregateType } from '@/modules/timeline/domain/entities/timeline-event.entity';
import type { ITimelineEventRepository } from '@/modules/timeline/domain/repositories/timeline-event-repository.interface';
import { TIMELINE_EVENT_REPOSITORY } from '@/modules/timeline/timeline.tokens';

/** Dados de entrada mapeados a partir do integration event recebido via RabbitMQ */
export interface RecordEventInput {
  /** ID original do integration event — usado para garantir idempotência */
  sourceEventId: string;
  /** Routing key do evento (ex: charge.created.v1) */
  eventType: string;
  aggregateId: string;
  aggregateType: AggregateType;
  payload: Record<string, unknown>;
  correlationId: string;
  timestamp: Date;
}

/**
 * Caso de uso de escrita da timeline.
 * Converte o input do consumer em entidade de domínio e persiste.
 * Chamado exclusivamente pelo TimelineConsumer via RabbitMQ.
 */
@Injectable()
export class RecordEventUseCase {
  private readonly logger = new Logger(RecordEventUseCase.name);

  constructor(
    @Inject(TIMELINE_EVENT_REPOSITORY)
    private readonly repo: ITimelineEventRepository,
  ) {}

  async execute(input: RecordEventInput): Promise<void> {
    const event = TimelineEvent.create({
      eventType: input.eventType,
      aggregateId: input.aggregateId,
      aggregateType: input.aggregateType,
      payload: input.payload,
      correlationId: input.correlationId,
      timestamp: input.timestamp,
      metadata: { sourceEventId: input.sourceEventId },
    });

    await this.repo.append(event);

    this.logger.log(
      `Evento registrado [${event.eventType}] aggregateId=${event.aggregateId} correlationId=${event.correlationId}`,
    );
  }
}
