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

  /** Token único de link de pagamento — gerado no domínio, imutável */
  @Prop({ required: true, unique: true })
  paymentLinkToken!: string;

  /** Método de pagamento: pix | boleto | credit_card — null até seleção pelo cliente */
  // type explícito: o tipo TS é union (string | null) e o Mongoose não infere
  // o tipo a partir de union — sem isto o decorator @Prop quebra no boot.
  @Prop({ type: String, required: false, default: null })
  paymentMethod?: string | null;

  /** Data/hora de expiração da cobrança */
  @Prop({ required: true })
  expiresAt!: Date;
}

export type ChargeDocument = HydratedDocument<ChargeModel>;
export const ChargeSchema = SchemaFactory.createForClass(ChargeModel);

// Índice composto para o scheduler de expiração: busca status abertos com expiresAt vencido
ChargeSchema.index({ status: 1, expiresAt: 1 });
// Índice único para lookup de cobranças via link de pagamento
ChargeSchema.index({ paymentLinkToken: 1 }, { unique: true });
