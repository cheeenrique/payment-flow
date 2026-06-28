import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { ISessionRepository } from '@/modules/auth/domain/repositories/session-repository.interface';
import { UserLoggedOutEvent } from '@/modules/auth/domain/events/user-logged-out.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SESSION_REPOSITORY } from '@/modules/auth/auth.tokens';

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: ISessionRepository,
    private readonly eventBus: EventBusService,
  ) {}

  async execute(userId: string, email: string): Promise<void> {
    await this.sessionRepo.deleteByUserId(userId);

    this.eventBus.publish(
      new UserLoggedOutEvent(userId, randomUUID(), email),
    );
  }
}
