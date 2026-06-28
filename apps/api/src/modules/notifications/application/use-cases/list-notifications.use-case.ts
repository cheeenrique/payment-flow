import { Inject, Injectable } from '@nestjs/common';
import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';
import type { INotificationRepository } from '@/modules/notifications/domain/repositories/notification-repository.interface';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/notifications.tokens';

export interface ListNotificationsInput {
  /** Quando informado, filtra notificações do usuário; sem filtro retorna todas */
  userId?: string;
  page: number;
  limit: number;
}

/**
 * Lista notificações do sistema com paginação.
 *
 * Com userId: retorna apenas notificações do usuário autenticado.
 * Sem userId: retorna todas as notificações (uso administrativo).
 */
@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: INotificationRepository,
  ) {}

  async execute(input: ListNotificationsInput): Promise<PaginatedResult<Notification>> {
    const { userId, page, limit } = input;
    const { items, total } = userId
      ? await this.repo.findByUserId(userId, page, limit)
      : await this.repo.findAll(page, limit);
    return { items, total, page, limit };
  }
}
