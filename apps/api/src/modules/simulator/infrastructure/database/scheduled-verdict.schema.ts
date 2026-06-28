import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * Schema Mongoose para vereditos de simulação agendados.
 *
 * Coleção: simulator_scheduled_verdicts
 *
 * Índice composto {status, dueAt} — otimiza a query do scheduler:
 *   { status: 'pending', dueAt: { $lte: now } }
 *
 * Índice único em paymentId — garante que um pagamento produza no máximo
 * um veredito agendado, mesmo em caso de reprocessamento da mensagem.
 */
@Schema({ collection: 'simulator_scheduled_verdicts', timestamps: true })
export class ScheduledVerdictModel {
  // _id usa o UUID gerado pela entidade de domínio (consistente com SimulatorConfigModel)
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ required: true, unique: true })
  paymentId!: string;

  @Prop({ required: true })
  correlationId!: string;

  @Prop({ required: true })
  paymentMethod!: string;

  @Prop({ required: true, enum: ['approved', 'failed'] })
  outcome!: string;

  @Prop({ required: false })
  failureReason?: string;

  @Prop({ required: true })
  dueAt!: Date;

  @Prop({ required: true, enum: ['pending', 'processed'], default: 'pending' })
  status!: string;
}

export type ScheduledVerdictDocument = HydratedDocument<ScheduledVerdictModel>;
export const ScheduledVerdictSchema = SchemaFactory.createForClass(ScheduledVerdictModel);

// Índice composto para a query de polling do scheduler
ScheduledVerdictSchema.index({ status: 1, dueAt: 1 });
