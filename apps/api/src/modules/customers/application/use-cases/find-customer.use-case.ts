import { Inject, Injectable } from '@nestjs/common';

import { NotFoundError } from '@/shared/errors/not-found.error';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import type { CustomerOutput } from './create-customer.use-case';
import { CUSTOMER_REPOSITORY } from '@/modules/customers/customers.tokens';

@Injectable()
export class FindCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: ICustomerRepository,
  ) {}

  async execute(id: string): Promise<CustomerOutput> {
    const customer = await this.customerRepo.findById(id);
    if (!customer) {
      throw new NotFoundError('Cliente não encontrado', undefined, { id });
    }

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      document: customer.document,
      phone: customer.phone,
      status: customer.status,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    };
  }
}
