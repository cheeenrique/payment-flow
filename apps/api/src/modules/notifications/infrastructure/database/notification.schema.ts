import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Schema Mongoose para a coleção 'notifications'.
 *
 * O campo _id armazena o UUID gerado pelo domínio (string).
 * Timestamps automáticos registram apenas createdAt (notificações são imutáveis).
 */
@Schema({
  collection: 'notifications',
  timestamps: { createdAt: true, updatedAt: false },
})
export class NotificationModel {
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ required: true, enum: ['info', 'success', 'warning', 'error'] })
  type!: string;

  @Prop({ required: true, index: true })
  eventType!: string;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  message!: string;

  /** Indexado para consultas filtradas por usuário */
  @Prop({ index: true })
  userId?: string;

  /** Indexado para correlacionar com entidades de cliente */
  @Prop({ index: true })
  customerId?: string;

  @Prop({ required: true, default: false })
  read!: boolean;
}

export type NotificationDocument = HydratedDocument<NotificationModel>;
export const NotificationSchema = SchemaFactory.createForClass(NotificationModel);
