import { randomUUID } from 'crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

export class UserRegisteredEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'auth.user.registered.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    name: string,
    email: string,
  ) {
    this.payload = { name, email };
  }
}
