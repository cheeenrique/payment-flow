import type { TimelineEvent, AggregateType } from '@/modules/timeline/domain/entities/timeline-event.entity';

/**
 * Porta de persistência da timeline.
 * O domínio depende desta interface — nunca da implementação Mongoose.
 * Contrato append-only: eventos não são alterados nem removidos.
 */
export interface ITimelineEventRepository {
  /**
   * Persiste o evento de forma idempotente.
   * Duplicatas identificadas por sourceEventId são silenciosamente ignoradas.
   */
  append(event: TimelineEvent): Promise<void>;

  /**
   * Retorna todos os eventos de um aggregate, ordenados por timestamp asc.
   * aggregateType é opcional para permitir buscas genéricas por ID.
   */
  findByAggregateId(
    aggregateId: string,
    aggregateType?: AggregateType,
  ): Promise<TimelineEvent[]>;

  /** Listagem global paginada, ordenada por timestamp desc */
  findAll(page: number, limit: number): Promise<{ items: TimelineEvent[]; total: number }>;
}
