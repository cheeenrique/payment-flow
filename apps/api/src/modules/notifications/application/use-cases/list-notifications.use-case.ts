import { Inject, Injectable } from '@nestjs/common';
import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';
import type { INotificationRepository } from '@/modules/notifications/domain/repositories/notification-repository.interface';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/notifications.tokens';

export interface ListNotificationsInput {
  /** Filtro opcional pelo cliente do evento de negócio */
  customerId?: string;
  page: number;
  limit: number;
}

/**
 * Feed de notificações do dashboard, paginado.
 *
 * Notificações são eventos de sistema (charge/payment/invoice), visíveis
 * a operadores/admins — não vinculadas a um usuário específico.
 * Filtro opcional por customerId para a visão por cliente.
 */
@Injectable()
export class ListNotificationsUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: INotificationRepository,
  ) {}

  async execute(input: ListNotificationsInput): Promise<PaginatedResult<Notification>> {
    const { customerId, page, limit } = input;
    const { items, total } = await this.repo.findMany(
      { customerId },
      page,
      limit,
    );
    return { items, total, page, limit };
  }
}
