import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Documento Mongoose para a collection 'customers'.
 * _id usa string (UUID) para manter consistência com a entidade de domínio.
 */
@Schema({ collection: 'customers', timestamps: true })
export class CustomerModel {
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true, unique: true, index: true })
  email!: string;

  @Prop({ required: true })
  document!: string;

  @Prop()
  phone?: string;

  @Prop({ required: true, default: 'active' })
  status!: string;
}

export type CustomerDocument = HydratedDocument<CustomerModel>;
export const CustomerSchema = SchemaFactory.createForClass(CustomerModel);
