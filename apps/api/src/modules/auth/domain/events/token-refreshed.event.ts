import { randomUUID } from 'crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

export class TokenRefreshedEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'auth.token.refreshed.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    email: string,
  ) {
    this.payload = { email };
  }
}
