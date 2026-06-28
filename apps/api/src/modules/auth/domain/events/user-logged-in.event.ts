import { randomUUID } from 'crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

export class UserLoggedInEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'auth.user.logged_in.v1';
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
