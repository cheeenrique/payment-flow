import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { NotFoundError } from '@/shared/errors/not-found.error';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import { CustomerUpdatedEvent } from '@/modules/customers/domain/events/customer-updated.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import type { CustomerOutput } from './create-customer.use-case';
import { CUSTOMER_REPOSITORY } from '@/modules/customers/customers.tokens';

export interface UpdateCustomerInput {
  id: string;
  name?: string;
  document?: string;
  phone?: string;
}

@Injectable()
export class UpdateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: ICustomerRepository,
    private readonly eventBus: EventBusService,
    private readonly sse: SseService,
  ) {}

  async execute(input: UpdateCustomerInput): Promise<CustomerOutput> {
    const existing = await this.customerRepo.findById(input.id);
    if (!existing) {
      throw new NotFoundError('Cliente não encontrado', undefined, {
        id: input.id,
      });
    }

    const updated = existing.withUpdate({
      name: input.name,
      document: input.document,
      phone: input.phone,
    });

    await this.customerRepo.update(updated);

    this.eventBus.publish(
      new CustomerUpdatedEvent(
        updated.id,
        randomUUID(),
        updated.name,
        updated.document,
        updated.phone,
      ),
    );

    this.sse.emit({
      type: 'customer.updated',
      data: { id: updated.id, name: updated.name },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      document: updated.document,
      phone: updated.phone,
      status: updated.status,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
