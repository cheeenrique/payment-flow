import { Inject, Injectable } from '@nestjs/common';
import type { INotificationRepository } from '@/modules/notifications/domain/repositories/notification-repository.interface';
import { NotFoundError } from '@/shared/errors/not-found.error';
import { SseService } from '@/infra/sse/sse.service';
import { NOTIFICATION_REPOSITORY } from '@/modules/notifications/notifications.tokens';

/**
 * Marca uma notificação como lida e notifica o frontend via SSE.
 *
 * Verifica existência antes de atualizar para falhar explicitamente
 * em vez de retornar silenciosamente em caso de id inválido.
 */
@Injectable()
export class MarkAsReadUseCase {
  constructor(
    @Inject(NOTIFICATION_REPOSITORY)
    private readonly repo: INotificationRepository,
    private readonly sseService: SseService,
  ) {}

  async execute(id: string): Promise<void> {
    const notification = await this.repo.findById(id);

    if (!notification) {
      throw new NotFoundError('Notificação não encontrada', undefined, { id });
    }

    await this.repo.markAsRead(id);

    // Comunica mudança de status ao frontend em tempo real
    this.sseService.emit({
      type: 'notification.read',
      data: { id },
    });
  }
}
