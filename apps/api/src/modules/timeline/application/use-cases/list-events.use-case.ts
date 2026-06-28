import { Inject, Injectable } from '@nestjs/common';
import type { TimelineEvent, AggregateType } from '@/modules/timeline/domain/entities/timeline-event.entity';
import type { ITimelineEventRepository } from '@/modules/timeline/domain/repositories/timeline-event-repository.interface';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { TIMELINE_EVENT_REPOSITORY } from '@/modules/timeline/timeline.tokens';

/** Input para listagem global paginada */
export interface ListEventsGlobalInput {
  page: number;
  limit: number;
}

/** Input para busca do histórico completo de um aggregate específico */
export interface ListEventsByAggregateInput {
  aggregateId: string;
  aggregateType?: AggregateType;
}

/**
 * Caso de uso de leitura da timeline.
 *
 * executeGlobal: listagem paginada de todos os eventos (page/limit).
 * executeByAggregate: histórico completo de um aggregate — sem paginação,
 * pois o caller precisa de todos os eventos para reconstruir o estado.
 */
@Injectable()
export class ListEventsUseCase {
  constructor(
    @Inject(TIMELINE_EVENT_REPOSITORY)
    private readonly repo: ITimelineEventRepository,
  ) {}

  /** Retorna página de eventos globais da timeline */
  async executeGlobal(input: ListEventsGlobalInput): Promise<PaginatedResult<TimelineEvent>> {
    const { page, limit } = input;
    const { items, total } = await this.repo.findAll(page, limit);
    return { items, total, page, limit };
  }

  /** Retorna histórico completo de um aggregate, ordenado por timestamp asc */
  async executeByAggregate(input: ListEventsByAggregateInput): Promise<TimelineEvent[]> {
    return this.repo.findByAggregateId(input.aggregateId, input.aggregateType);
  }
}
