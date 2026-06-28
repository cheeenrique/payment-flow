import { Field, Float, ID, ObjectType } from '@nestjs/graphql';

/**
 * Tipo GraphQL da nota fiscal (read model, code-first).
 * Expõe todos os campos relevantes para consultas do dashboard.
 */
@ObjectType('Invoice')
export class InvoiceType {
  @Field(() => ID)
  id!: string;

  @Field()
  paymentId!: string;

  @Field()
  chargeId!: string;

  @Field()
  customerId!: string;

  @Field(() => Float)
  amount!: number;

  /** Status atual da emissão: requested | processing | issued | failed */
  @Field()
  status!: string;

  @Field(() => Date, { nullable: true, description: 'Data de emissão da nota (nulo enquanto pendente)' })
  issuedAt!: Date | null;

  @Field(() => String, { nullable: true, description: 'Número da nota fiscal simulado (ex: NF-A1B2C3D4)' })
  externalReference!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
