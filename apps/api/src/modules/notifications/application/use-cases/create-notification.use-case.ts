import { Inject, Injectable } from '@nestjs/common';
import {
  Notification,
  NotificationType,
} from '@/modules/notifications/domain/entities/notification.entity';
import type { INotificationRepository } from '@/modules/notifications/domain/repositories/notification-repository.interface';
import { SseService } from '@/infra/sse/sse.service';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/notifications.tokens';

export interface CreateNotificationInput {
  type: NotificationType;
  eventType: string;
  title: string;
  message: string;
  userId?: string;
  customerId?: string;
}

/**
 * Cria e persiste uma notificação, depois a empurra via SSE para o frontend.
 *
 * O emit SSE é fire-and-forget: não bloqueia nem propaga erro para o caller.
 * Erros de SSE são descartados silenciosamente pois não devem impedir persistência.
 */
@Injectable()
export class CreateNotificationUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: INotificationRepository,
    private readonly sseService: SseService,
  ) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    const notification = Notification.create({
      type: input.type,
      eventType: input.eventType,
      title: input.title,
      message: input.message,
      userId: input.userId,
      customerId: input.customerId,
    });

    await this.repo.create(notification);

    // Emite para clientes SSE conectados sem aguardar nem bloquear
    this.pushSse(notification);

    return notification;
  }

  /** Dispara SSE de forma não-bloqueante; erros são isolados do fluxo principal */
  private pushSse(notification: Notification): void {
    this.sseService.emit({
      type: 'notification.created',
      data: {
        id: notification.id,
        type: notification.type,
        eventType: notification.eventType,
        title: notification.title,
        message: notification.message,
        read: notification.read,
        createdAt: notification.createdAt.toISOString(),
      },
    });
  }
}
