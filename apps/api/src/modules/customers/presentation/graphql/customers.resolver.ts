import { Args, Int, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';
import { FindCustomerUseCase } from '@/modules/customers/application/use-cases/find-customer.use-case';
import { ListCustomersUseCase } from '@/modules/customers/application/use-cases/list-customers.use-case';
import { buildPaginationMeta } from '@/shared/pagination/pagination-meta.helper';
import { CustomerType, CustomersPageType } from './customer.type';

/**
 * Resolver GraphQL de clientes — apenas queries (lado de leitura / CQRS).
 * Reutiliza os mesmos use cases do REST; nenhuma duplicação de lógica.
 */
@Resolver(() => CustomerType)
@UseGuards(GqlAuthGuard)
export class CustomersResolver {
  constructor(
    private readonly findCustomer: FindCustomerUseCase,
    private readonly listCustomers: ListCustomersUseCase,
  ) {}

  @Query(() => CustomerType, { name: 'customer' })
  async findById(
    @Args('id', { type: () => String }) id: string,
  ): Promise<CustomerType> {
    return this.findCustomer.execute(id) as Promise<CustomerType>;
  }

  @Query(() => CustomersPageType, { name: 'customers' })
  async list(
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 })
    page: number,
    @Args('limit', { type: () => Int, nullable: true, defaultValue: 20 })
    limit: number,
  ): Promise<CustomersPageType> {
    const result = await this.listCustomers.execute({ page, limit });
    const { hasNext, hasPrev } = buildPaginationMeta(result);
    return {
      items: result.items as CustomerType[],
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNext,
      hasPrev,
    };
  }
}
