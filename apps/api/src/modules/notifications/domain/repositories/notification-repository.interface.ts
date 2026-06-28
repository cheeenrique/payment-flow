import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';

/**
 * Contrato de repositório para notificações.
 *
 * Definido no domínio; implementado na infraestrutura.
 * Domínio nunca conhece MongoDB, Mongoose ou qualquer detalhe técnico.
 */
export interface INotificationRepository {
  create(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  /** Lista notificações de um usuário específico paginadas, mais recentes primeiro */
  findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Notification[]; total: number }>;
  /** Lista todas as notificações do sistema paginadas, mais recentes primeiro */
  findAll(page: number, limit: number): Promise<{ items: Notification[]; total: number }>;
  /** Marca diretamente no banco sem buscar a entidade inteira */
  markAsRead(id: string): Promise<void>;
}
