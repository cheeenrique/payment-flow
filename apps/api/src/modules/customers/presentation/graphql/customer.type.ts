import { Field, ObjectType } from '@nestjs/graphql';

/** Tipo GraphQL que representa um cliente no lado de leitura (query side) */
@ObjectType('Customer')
export class CustomerType {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field()
  email!: string;

  @Field()
  document!: string;

  @Field({ nullable: true })
  phone?: string;

  @Field()
  status!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}

/** Tipo de resposta paginada para a query de listagem de clientes */
@ObjectType('CustomersPage')
export class CustomersPageType {
  @Field(() => [CustomerType])
  items!: CustomerType[];

  @Field()
  total!: number;

  @Field()
  page!: number;

  @Field()
  limit!: number;

  @Field()
  hasNext!: boolean;

  @Field()
  hasPrev!: boolean;
}
