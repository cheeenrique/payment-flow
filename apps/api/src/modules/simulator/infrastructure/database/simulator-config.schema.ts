import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/** Sub-documento para as regras de PIX */
@Schema({ _id: false })
class PixRulesModel {
  @Prop({ required: true })
  successRate!: number;

  @Prop({ required: true })
  maxDelayMs!: number;
}

const PixRulesSchema = SchemaFactory.createForClass(PixRulesModel);

/** Sub-documento para as regras de Boleto */
@Schema({ _id: false })
class BoletoRulesModel {
  @Prop({ required: true })
  delayMs!: number;

  @Prop({ required: true })
  successRate!: number;
}

const BoletoRulesSchema = SchemaFactory.createForClass(BoletoRulesModel);

/** Sub-documento para as regras de Cartão de Crédito */
@Schema({ _id: false })
class CreditCardRulesModel {
  @Prop({ required: true })
  successRate!: number;

  @Prop({ required: true })
  riskFactor!: number;
}

const CreditCardRulesSchema = SchemaFactory.createForClass(CreditCardRulesModel);

/** Schema Mongoose para a configuração global do simulador */
@Schema({ collection: 'simulator_configs', timestamps: true })
export class SimulatorConfigModel {
  // _id definido explicitamente como string para usar o ID de domínio ('global')
  @Prop({ type: String, required: true })
  declare _id: string;

  @Prop({ type: PixRulesSchema, required: true })
  pix!: PixRulesModel;

  @Prop({ type: BoletoRulesSchema, required: true })
  boleto!: BoletoRulesModel;

  @Prop({ type: CreditCardRulesSchema, required: true })
  creditCard!: CreditCardRulesModel;
}

export type SimulatorConfigDocument = HydratedDocument<SimulatorConfigModel>;
export const SimulatorConfigSchema = SchemaFactory.createForClass(SimulatorConfigModel);
