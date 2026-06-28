import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Schema Mongoose para a coleção invoices.
 * paymentId tem índice único pois cada pagamento gera no máximo uma nota fiscal.
 */
@Schema({ collection: 'invoices', timestamps: true })
export class InvoiceModel {
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ required: true, unique: true, index: true })
  paymentId!: string;

  @Prop({ required: true })
  chargeId!: string;

  @Prop({ required: true })
  customerId!: string;

  @Prop({ required: true })
  amount!: number;

  @Prop({ required: true })
  status!: string;

  @Prop({ type: Date, default: null })
  issuedAt!: Date | null;

  @Prop({ type: String, default: null })
  externalReference!: string | null;
}

export type InvoiceDocument = HydratedDocument<InvoiceModel>;
export const InvoiceSchema = SchemaFactory.createForClass(InvoiceModel);
