import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema({ collection: 'sessions', timestamps: { createdAt: true, updatedAt: false } })
export class SessionModel {
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  refreshTokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;
}

export type SessionDocument = HydratedDocument<SessionModel>;
export const SessionSchema = SchemaFactory.createForClass(SessionModel);
