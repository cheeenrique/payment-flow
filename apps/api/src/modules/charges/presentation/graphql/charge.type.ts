import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

/**
 * Tipo GraphQL code-first da entidade Charge.
 * Usado pelo resolver de queries (lado de leitura — CQRS pragmático).
 * Campos de data exigem dateScalarMode: 'isoDate' no GraphQLModule raiz.
 */
@ObjectType('Charge')
export class ChargeType {
  /** Identificador único da cobrança (UUID) */
  @Field()
  id!: string;

  /** ID do cliente associado */
  @Field()
  customerId!: string;

  /** Valor da cobrança */
  @Field(() => Float)
  amount!: number;

  /** Moeda da cobrança (ex: BRL) */
  @Field()
  currency!: string;

  /** Descrição opcional da cobrança */
  @Field({ nullable: true })
  description?: string;

  /** Status atual do ciclo de vida */
  @Field()
  status!: string;

  /** Método de pagamento: pix | boleto | credit_card */
  @Field()
  paymentMethod!: string;

  /** Data/hora de expiração */
  @Field()
  expiresAt!: Date;

  /** Data/hora de criação */
  @Field()
  createdAt!: Date;

  /** Data/hora da última atualização */
  @Field()
  updatedAt!: Date;
}

/** Tipo de resposta paginada para a query de listagem de cobranças */
@ObjectType('ChargesPage')
export class ChargesPageType {
  @Field(() => [ChargeType])
  items!: ChargeType[];

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  page!: number;

  @Field(() => Int)
  limit!: number;

  @Field()
  hasNext!: boolean;

  @Field()
  hasPrev!: boolean;
}
