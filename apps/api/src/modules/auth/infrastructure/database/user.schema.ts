import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { DEFAULT_ROLE } from '@/modules/auth/domain/rbac/roles';

@Schema({ collection: 'users', timestamps: true })
export class UserModel {
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;

  // Papéis do usuário; novos usuários recebem o papel padrão (viewer).
  @Prop({ type: [String], required: true, default: [DEFAULT_ROLE] })
  roles!: string[];
}

export type UserDocument = HydratedDocument<UserModel>;
export const UserSchema = SchemaFactory.createForClass(UserModel);
