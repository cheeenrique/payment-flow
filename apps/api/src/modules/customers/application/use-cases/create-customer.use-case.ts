import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { ConflictError } from '@/shared/errors/conflict.error';
import { Customer } from '@/modules/customers/domain/entities/customer.entity';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import { CustomerCreatedEvent } from '@/modules/customers/domain/events/customer-created.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { CUSTOMER_REPOSITORY } from '@/modules/customers/customers.tokens';

export interface CreateCustomerInput {
  name: string;
  email: string;
  document: string;
  phone?: string;
}

export interface CustomerOutput {
  id: string;
  name: string;
  email: string;
  document: string;
  phone?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CreateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: ICustomerRepository,
    private readonly eventBus: EventBusService,
    private readonly sse: SseService,
  ) {}

  async execute(input: CreateCustomerInput): Promise<CustomerOutput> {
    const normalizedEmail = input.email.toLowerCase().trim();

    const existing = await this.customerRepo.findByEmail(normalizedEmail);
    if (existing) {
      throw new ConflictError('Email já cadastrado', undefined, {
        email: normalizedEmail,
      });
    }

    const customer = Customer.create({
      name: input.name,
      email: normalizedEmail,
      document: input.document,
      phone: input.phone,
    });

    await this.customerRepo.create(customer);

    this.eventBus.publish(
      new CustomerCreatedEvent(
        customer.id,
        randomUUID(),
        customer.name,
        customer.email,
        customer.document,
        customer.phone,
      ),
    );

    this.sse.emit({
      type: 'customer.created',
      data: { id: customer.id, name: customer.name, email: customer.email },
    });

    return this.toOutput(customer);
  }

  private toOutput(customer: Customer): CustomerOutput {
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
