import { Inject, Injectable } from '@nestjs/common';

import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import type { CustomerOutput } from './create-customer.use-case';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { CUSTOMER_REPOSITORY } from '@/modules/customers/customers.tokens';

export interface ListCustomersInput {
  page: number;
  limit: number;
}

@Injectable()
export class ListCustomersUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: ICustomerRepository,
  ) {}

  async execute(input: ListCustomersInput): Promise<PaginatedResult<CustomerOutput>> {
    const { items, total } = await this.customerRepo.list({
      page: input.page,
      limit: input.limit,
    });

    return {
      items: items.map((c) => ({
        id: c.id,
        name: c.name,
        email: c.email,
        document: c.document,
        phone: c.phone,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      total,
      page: input.page,
      limit: input.limit,
    };
  }
}
