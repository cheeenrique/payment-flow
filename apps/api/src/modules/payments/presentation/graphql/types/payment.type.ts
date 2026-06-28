import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';

/**
 * Tipo GraphQL code-first para a entidade Payment.
 * Usado pela query-side (GraphQL resolver) — leitura apenas.
 */
@ObjectType('Payment')
export class PaymentType {
  @Field(() => ID)
  id!: string;

  @Field()
  chargeId!: string;

  @Field()
  customerId!: string;

  @Field(() => Float)
  amount!: number;

  /** Método: pix | boleto | credit_card */
  @Field()
  method!: string;

  /** Status atual: pending | processing | approved | failed | expired */
  @Field()
  status!: string;

  @Field({ nullable: true })
  failureReason?: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/** Tipo de resposta paginada para a query de pagamentos por cobrança */
@ObjectType('PaymentsPage')
export class PaymentsPageType {
  @Field(() => [PaymentType])
  items!: PaymentType[];

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
