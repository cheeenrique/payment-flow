import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Schema Mongoose da collection "charges".
 * O _id é um UUID string gerado pelo domínio, não um ObjectId.
 * timestamps: true adiciona createdAt e updatedAt automaticamente.
 */
@Schema({ collection: 'charges', timestamps: true })
export class ChargeModel {
  /** UUID gerado pelo domínio — não usa ObjectId padrão do Mongo */
  @Prop({ type: String, required: true })
  declare _id: string;

  /** Referência ao cliente associado (sem FK — baixo acoplamento via eventos) */
  @Prop({ required: true, index: true })
  customerId!: string;

  /** Valor da cobrança em centavos ou reais (conforme definição do domínio) */
  @Prop({ required: true })
  amount!: number;

  /** Moeda da cobrança (padrão BRL) */
  @Prop({ required: true, default: 'BRL' })
  currency!: string;

  /** Descrição opcional da cobrança */
  @Prop()
  description?: string;

  /** Status atual do ciclo de vida — indexado para queries de listagem */
  @Prop({ required: true, index: true })
  status!: string;

  /** Método de pagamento: pix | boleto | credit_card */
  @Prop({ required: true })
  paymentMethod!: string;

  /** Data/hora de expiração da cobrança */
  @Prop({ required: true })
  expiresAt!: Date;
}

export type ChargeDocument = HydratedDocument<ChargeModel>;
export const ChargeSchema = SchemaFactory.createForClass(ChargeModel);
