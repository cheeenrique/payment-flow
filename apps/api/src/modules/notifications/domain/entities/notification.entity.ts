import { randomUUID } from 'crypto';

/** Tipos possíveis de notificação, mapeados por severidade */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationProps {
  id: string;
  type: NotificationType;
  /** Tipo de evento que originou a notificação (ex: payment.approved.v1) */
  eventType: string;
  title: string;
  message: string;
  /** Usuário destinatário da notificação (opcional para notificações globais) */
  userId?: string;
  /** Cliente relacionado ao evento de negócio */
  customerId?: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Entidade de domínio Notification.
 *
 * Imutável após criação — a única mutação permitida é marcar como lida,
 * que retorna uma nova instância (sem efeitos colaterais).
 * Não conhece NestJS, Mongoose ou qualquer framework.
 */
export class Notification {
  readonly id: string;
  readonly type: NotificationType;
  readonly eventType: string;
  readonly title: string;
  readonly message: string;
  readonly userId?: string;
  readonly customerId?: string;
  readonly read: boolean;
  readonly createdAt: Date;

  constructor(props: NotificationProps) {
    this.id = props.id;
    this.type = props.type;
    this.eventType = props.eventType;
    this.title = props.title;
    this.message = props.message;
    this.userId = props.userId;
    this.customerId = props.customerId;
    this.read = props.read;
    this.createdAt = props.createdAt;
  }

  /** Cria uma nova notificação com id gerado e read=false */
  static create(
    props: Omit<NotificationProps, 'id' | 'read' | 'createdAt'>,
  ): Notification {
    return new Notification({
      ...props,
      id: randomUUID(),
      read: false,
      createdAt: new Date(),
    });
  }

  /** Retorna nova instância com read=true sem mutar o original */
  markAsRead(): Notification {
    return new Notification({ ...this.toProps(), read: true });
  }

  private toProps(): NotificationProps {
    return {
      id: this.id,
      type: this.type,
      eventType: this.eventType,
      title: this.title,
      message: this.message,
      userId: this.userId,
      customerId: this.customerId,
      read: this.read,
      createdAt: this.createdAt,
    };
  }
}
