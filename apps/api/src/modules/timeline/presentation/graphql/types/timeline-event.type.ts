import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { GraphQLISODateTime } from '@nestjs/graphql';

/**
 * Tipo GraphQL que representa um evento registrado na timeline.
 * payload e metadata são serializados como JSON string pelo resolver
 * para suportar estrutura dinâmica sem necessidade de scalar customizado.
 */
@ObjectType('TimelineEvent')
export class TimelineEventType {
  @Field(() => ID, { description: 'Identificador único do evento de timeline' })
  id!: string;

  @Field({ description: 'Routing key do evento (ex: charge.created.v1)' })
  eventType!: string;

  @Field({ description: 'ID do aggregate de origem' })
  aggregateId!: string;

  @Field({ description: 'Tipo do aggregate (charge | payment | invoice | ...)' })
  aggregateType!: string;

  @Field({ description: 'Trace ID compartilhado por todos os eventos da mesma transação' })
  correlationId!: string;

  @Field(() => GraphQLISODateTime, { description: 'Instante em que o evento ocorreu' })
  timestamp!: Date;

  @Field({ description: 'Payload do evento serializado como JSON string' })
  payload!: string;

  @Field({ description: 'Metadata de rastreabilidade serializado como JSON string' })
  metadata!: string;
}

/** Tipo de resposta paginada para a query global de timeline */
@ObjectType('TimelineEventsPage')
export class TimelineEventsPageType {
  @Field(() => [TimelineEventType])
  items!: TimelineEventType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field()
  hasNext!: boolean;

  @Field()
  hasPrev!: boolean;
}
