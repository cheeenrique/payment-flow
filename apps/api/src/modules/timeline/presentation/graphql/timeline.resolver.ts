import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { ListEventsUseCase } from '@/modules/timeline/application/use-cases/list-events.use-case';
import { TimelineEventType, TimelineEventsPageType } from './types/timeline-event.type';
import { TimelineArgs, TimelineByAggregateArgs } from './types/timeline-query.args';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { buildPaginationMeta } from '@/shared/pagination/pagination-meta.helper';
import type { TimelineEvent } from '@/modules/timeline/domain/entities/timeline-event.entity';

/**
 * Resolver GraphQL da timeline (query side — CQRS pragmático).
 * Autenticação via JWT obrigatória em todas as queries.
 *
 * timeline: listagem global paginada → TimelineEventsPageType.
 * timelineByCharge / timelineByCustomer: histórico completo do aggregate → [TimelineEventType].
 */
@Resolver(() => TimelineEventType)
@UseGuards(GqlAuthGuard)
export class TimelineResolver {
  constructor(private readonly listEvents: ListEventsUseCase) {}

  @Query(() => TimelineEventsPageType, {
    name: 'timeline',
    description: 'Lista eventos globais da timeline com paginação',
  })
  async getTimeline(@Args() args: TimelineArgs): Promise<TimelineEventsPageType> {
    const page = args.page ?? 1;
    const limit = args.limit ?? 20;
    const result = await this.listEvents.executeGlobal({ page, limit });
    const { hasNext, hasPrev } = buildPaginationMeta(result);
    return {
      items: result.items.map((e) => this.toGqlType(e)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext,
      hasPrev,
    };
  }

  @Query(() => [TimelineEventType], {
    name: 'timelineByCharge',
    description: 'Todos os eventos associados a uma charge específica',
  })
  async getTimelineByCharge(
    @Args() args: TimelineByAggregateArgs,
  ): Promise<TimelineEventType[]> {
    const events = await this.listEvents.executeByAggregate({
      aggregateId: args.aggregateId,
      aggregateType: 'charge',
    });
    return events.map((e) => this.toGqlType(e));
  }

  @Query(() => [TimelineEventType], {
    name: 'timelineByCustomer',
    description: 'Todos os eventos associados a um customer específico',
  })
  async getTimelineByCustomer(
    @Args() args: TimelineByAggregateArgs,
  ): Promise<TimelineEventType[]> {
    const events = await this.listEvents.executeByAggregate({
      aggregateId: args.aggregateId,
      aggregateType: 'customer',
    });
    return events.map((e) => this.toGqlType(e));
  }

  /**
   * Mapeia a entidade de domínio para o tipo GQL.
   * payload e metadata são serializados como JSON string para
   * permitir estrutura dinâmica sem scalar customizado.
   */
  private toGqlType(event: TimelineEvent): TimelineEventType {
    const type = new TimelineEventType();
    type.id = event.id;
    type.eventType = event.eventType;
    type.aggregateId = event.aggregateId;
    type.aggregateType = event.aggregateType;
    type.correlationId = event.correlationId;
    type.timestamp = event.timestamp;
    type.payload = JSON.stringify(event.payload);
    type.metadata = JSON.stringify(event.metadata);
    return type;
  }
}
