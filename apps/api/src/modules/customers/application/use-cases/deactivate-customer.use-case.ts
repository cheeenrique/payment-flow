import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

import { NotFoundError } from '@/shared/errors/not-found.error';
import { ConflictError } from '@/shared/errors/conflict.error';
import type { ICustomerRepository } from '@/modules/customers/domain/repositories/customer-repository.interface';
import { CustomerDeactivatedEvent } from '@/modules/customers/domain/events/customer-deactivated.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { CUSTOMER_REPOSITORY } from '@/modules/customers/customers.tokens';

@Injectable()
export class DeactivateCustomerUseCase {
  constructor(
    @Inject(CUSTOMER_REPOSITORY)
    private readonly customerRepo: ICustomerRepository,
    private readonly eventBus: EventBusService,
    private readonly sse: SseService,
  ) {}

  async execute(id: string): Promise<void> {
    const existing = await this.customerRepo.findById(id);
    if (!existing) {
      throw new NotFoundError('Cliente não encontrado', undefined, { id });
    }

    if (!existing.isActive()) {
      throw new ConflictError('Cliente já está inativo', undefined, { id });
    }

    const deactivated = existing.deactivate();
    await this.customerRepo.update(deactivated);

    this.eventBus.publish(
      new CustomerDeactivatedEvent(deactivated.id, randomUUID()),
    );

    this.sse.emit({
      type: 'customer.deactivated',
      data: { id: deactivated.id },
    });
  }
}
