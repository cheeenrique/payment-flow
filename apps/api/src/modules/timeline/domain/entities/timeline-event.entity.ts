import { randomUUID } from 'crypto';

/**
 * Tipos de aggregate rastreados pela timeline.
 * Representa a origem de cada evento registrado.
 */
export type AggregateType =
  | 'charge'
  | 'payment'
  | 'invoice'
  | 'customer'
  | 'notification'
  | 'system';

export interface TimelineEventProps {
  id: string;
  eventType: string;
  aggregateId: string;
  aggregateType: AggregateType;
  payload: Record<string, unknown>;
  correlationId: string;
  timestamp: Date;
  /** Dados extras de rastreabilidade (ex: sourceEventId para idempotência) */
  metadata: Record<string, unknown>;
}

/**
 * Entidade imutável de evento de timeline.
 * Append-only: nunca é alterada após persistência.
 * O domínio não depende de NestJS nem de Mongoose.
 */
export class TimelineEvent {
  readonly id: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateType: AggregateType;
  readonly payload: Record<string, unknown>;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly metadata: Record<string, unknown>;

  constructor(props: TimelineEventProps) {
    this.id = props.id;
    this.eventType = props.eventType;
    this.aggregateId = props.aggregateId;
    this.aggregateType = props.aggregateType;
    this.payload = props.payload;
    this.correlationId = props.correlationId;
    this.timestamp = props.timestamp;
    this.metadata = props.metadata;
  }

  /** Cria novo evento com UUID gerado automaticamente */
  static create(props: Omit<TimelineEventProps, 'id'>): TimelineEvent {
    return new TimelineEvent({ ...props, id: randomUUID() });
  }
}
