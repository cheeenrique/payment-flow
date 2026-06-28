/**
 * Contract for all integration events published to RabbitMQ.
 * Naming convention: <domain>.<event>.<version> (e.g. payment.approved.v1)
 */
export interface IntegrationEvent {
  /** UUID uniquely identifying this event instance */
  id: string;
  /** Routing key: <domain>.<event>.<version> */
  type: string;
  /** ID of the aggregate that originated the event */
  aggregateId: string;
  /** UTC timestamp of when the event was created */
  timestamp: Date;
  /** Event-specific payload */
  payload: Record<string, unknown>;
  /** Trace ID propagated across the entire transaction */
  correlationId: string;
}
