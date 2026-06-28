import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Schema Mongoose para a collection "payments".
 * O _id é armazenado como UUID string (consistente com demais módulos).
 */
@Schema({ collection: 'payments', timestamps: true })
export class PaymentModel {
  @Prop({ type: String, required: true })
  declare _id: string;

  /** Referência à cobrança que originou o pagamento */
  @Prop({ required: true, index: true })
  chargeId!: string;

  /** Cliente que realizou o pagamento */
  @Prop({ required: true, index: true })
  customerId!: string;

  @Prop({ required: true })
  amount!: number;

  /** Método de pagamento: pix | boleto | credit_card */
  @Prop({ required: true })
  method!: string;

  /** Estado atual: pending | processing | approved | failed | expired */
  @Prop({ required: true, default: 'pending' })
  status!: string;

  /** Chave de idempotência para deduplicação */
  @Prop({ sparse: true, unique: true })
  idempotencyKey?: string;

  /** Resposta bruta do processador simulado */
  @Prop({ type: Object })
  providerResponse?: Record<string, unknown>;

  /** Motivo da falha ou expiração */
  @Prop()
  failureReason?: string;
}

export type PaymentDocument = HydratedDocument<PaymentModel>;
export const PaymentSchema = SchemaFactory.createForClass(PaymentModel);

// Índice composto para listagem de pagamentos por cobrança ordenados por data
PaymentSchema.index({ chargeId: 1, createdAt: -1 });
