import type { Notification } from '@/modules/notifications/domain/entities/notification.entity';

/** Filtros opcionais para o feed de notificações do dashboard */
export interface NotificationFilter {
  /** Restringe ao cliente relacionado ao evento de negócio */
  customerId?: string;
}

/**
 * Contrato de repositório para notificações.
 *
 * Definido no domínio; implementado na infraestrutura.
 * Domínio nunca conhece MongoDB, Mongoose ou qualquer detalhe técnico.
 */
export interface INotificationRepository {
  create(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  /**
   * Feed global paginado, ordenado por mais recentes.
   * Notificações são eventos de sistema (charge/payment/invoice), não
   * vinculados a um usuário; aplica filtros opcionais quando informados.
   */
  findMany(
    filter: NotificationFilter,
    page: number,
    limit: number,
  ): Promise<{ items: Notification[]; total: number }>;
  /** Marca diretamente no banco sem buscar a entidade inteira */
  markAsRead(id: string): Promise<void>;
}
