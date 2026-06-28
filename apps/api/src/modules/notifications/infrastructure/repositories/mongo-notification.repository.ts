import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Notification,
  NotificationType,
} from '@/modules/notifications/domain/entities/notification.entity';
import type { INotificationRepository } from '@/modules/notifications/domain/repositories/notification-repository.interface';
import {
  NotificationModel,
  NotificationDocument,
} from '@/modules/notifications/infrastructure/database/notification.schema';

/** Formato lean retornado pelo Mongoose — sem métodos de instância */
interface NotificationLean {
  _id: string;
  type: string;
  eventType: string;
  title: string;
  message: string;
  userId?: string;
  customerId?: string;
  read: boolean;
  createdAt: Date;
}

/**
 * Implementação MongoDB do repositório de notificações.
 *
 * Toda leitura usa .lean() para evitar overhead de instanciação Mongoose.
 * O mapeamento toDomain garante que o domínio nunca receba documentos Mongoose.
 */
@Injectable()
export class MongoNotificationRepository implements INotificationRepository {
  constructor(
    @InjectModel(NotificationModel.name)
    private readonly model: Model<NotificationDocument>,
  ) {}

  async create(notification: Notification): Promise<void> {
    await this.model.create({
      _id: notification.id,
      type: notification.type,
      eventType: notification.eventType,
      title: notification.title,
      message: notification.message,
      userId: notification.userId,
      customerId: notification.customerId,
      read: notification.read,
    });
  }

  async findById(id: string): Promise<Notification | null> {
    const doc = await this.model
      .findById(id)
      .lean<NotificationLean>()
      .exec();
    return doc ? this.toDomain(doc) : null;
  }

  async findByUserId(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Notification[]; total: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<NotificationLean[]>()
        .exec(),
      this.model.countDocuments({ userId }).exec(),
    ]);
    return { items: docs.map((d) => this.toDomain(d)), total };
  }

  async findAll(page: number, limit: number): Promise<{ items: Notification[]; total: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      this.model
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean<NotificationLean[]>()
        .exec(),
      this.model.countDocuments().exec(),
    ]);
    return { items: docs.map((d) => this.toDomain(d)), total };
  }

  async markAsRead(id: string): Promise<void> {
    await this.model.updateOne({ _id: id }, { $set: { read: true } }).exec();
  }

  /** Converte documento Mongoose em entidade de domínio pura */
  private toDomain(doc: NotificationLean): Notification {
    return new Notification({
      id: doc._id,
      type: doc.type as NotificationType,
      eventType: doc.eventType,
      title: doc.title,
      message: doc.message,
      userId: doc.userId,
      customerId: doc.customerId,
      read: doc.read,
      createdAt: doc.createdAt,
    });
  }
}
