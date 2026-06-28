import { Inject, Injectable } from '@nestjs/common';
import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';
import type { INotificationRepository } from '@/modules/notifications/domain/repositories/notification-repository.interface';
import { NotFoundError } from '@/shared/errors/not-found.error';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/notifications.tokens';

/**
 * Busca uma notificação específica por id.
 * Lança NotFoundError se não existir.
 */
@Injectable()
export class GetNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: INotificationRepository,
  ) {}

  async execute(id: string): Promise<Notification> {
    const notification = await this.repo.findById(id);

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada', undefined, { id });
    }

    return notification;
  }
}
