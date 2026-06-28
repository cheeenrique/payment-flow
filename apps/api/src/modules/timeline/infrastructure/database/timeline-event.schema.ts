import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Schema Mongoose para a collection timeline_events.
 * Segue o padrão do projeto: _id string (UUID), sem timestamps automáticos
 * pois o timestamp de negócio é mantido no campo `timestamp`.
 */
@Schema({ collection: 'timeline_events', timestamps: false })
export class TimelineEventModel {
  /** UUID do evento de timeline (gerado pelo domínio) */
  @Prop({ type: String, required: true })
  declare _id: string;

  /** Routing key do evento de origem (ex: charge.created.v1) */
  @Prop({ required: true, index: true })
  eventType!: string;

  /** ID do aggregate de origem — principal critério de busca */
  @Prop({ required: true, index: true })
  aggregateId!: string;

  /** Tipo do aggregate (charge | payment | invoice | ...) */
  @Prop({ required: true, index: true })
  aggregateType!: string;

  /** Payload original do integration event */
  @Prop({ type: Object, required: true })
  payload!: Record<string, unknown>;

  /** Trace ID que une todos os eventos de uma mesma transação */
  @Prop({ required: true, index: true })
  correlationId!: string;

  /** Instante em que o evento ocorreu no domínio de origem */
  @Prop({ required: true })
  timestamp!: Date;

  /** Dados auxiliares de rastreabilidade (inclui sourceEventId para idempotência) */
  @Prop({ type: Object, default: {} })
  metadata!: Record<string, unknown>;
}

export type TimelineEventDocument = HydratedDocument<TimelineEventModel>;
export const TimelineEventSchema = SchemaFactory.createForClass(TimelineEventModel);

/**
 * Índice único esparso em metadata.sourceEventId para garantir idempotência
 * no consumo de eventos via RabbitMQ (at-least-once delivery).
 */
TimelineEventSchema.index(
  { 'metadata.sourceEventId': 1 },
  { unique: true, sparse: true, name: 'idx_sourceEventId_unique' },
);
