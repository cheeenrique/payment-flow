import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/** Tipo GraphQL para regras de simulação do PIX */
@ObjectType()
export class PixRulesType {
  @Field(() => Float, { description: 'Taxa de aprovação — valor entre 0 e 1' })
  successRate!: number;

  @Field(() => Int, { description: 'Delay máximo de processamento em milissegundos' })
  maxDelayMs!: number;
}

/** Tipo GraphQL para regras de simulação do Boleto */
@ObjectType()
export class BoletoRulesType {
  @Field(() => Int, { description: 'Delay de compensação simulado em milissegundos' })
  delayMs!: number;

  @Field(() => Float, { description: 'Taxa de pagamento efetivo — valor entre 0 e 1' })
  successRate!: number;
}

/** Tipo GraphQL para regras de simulação do Cartão de Crédito */
@ObjectType()
export class CreditCardRulesType {
  @Field(() => Float, { description: 'Taxa de aprovação pela adquirente — valor entre 0 e 1' })
  successRate!: number;

  @Field(() => Float, { description: 'Fator de risco sistêmico — valor entre 0 e 1' })
  riskFactor!: number;
}

/** Tipo GraphQL raiz para a configuração completa do simulador */
@ObjectType()
export class SimulatorConfigType {
  @Field({ description: 'ID da configuração (sempre "global")' })
  id!: string;

  @Field(() => PixRulesType, { description: 'Regras de simulação para PIX' })
  pix!: PixRulesType;

  @Field(() => BoletoRulesType, { description: 'Regras de simulação para Boleto' })
  boleto!: BoletoRulesType;

  @Field(() => CreditCardRulesType, { description: 'Regras de simulação para Cartão de Crédito' })
  creditCard!: CreditCardRulesType;

  @Field({ description: 'Data e hora da última atualização (ISO 8601)' })
  updatedAt!: string;
}
