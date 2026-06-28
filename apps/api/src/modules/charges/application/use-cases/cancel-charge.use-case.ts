import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Charge } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { ChargeCannotBeCanceledError } from '@/modules/charges/domain/errors/charge-cannot-be-canceled.error';
import { ChargeCanceledEvent } from '@/modules/charges/domain/events/charge-canceled.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/**
 * Caso de uso: cancelamento de cobrança.
 * Valida a transição de estado, persiste e publica charge.canceled.v1.
 * Somente cobranças "pending" ou "awaiting_payment" podem ser canceladas.
 */
@Injectable()
export class CancelChargeUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(id: string): Promise<void> {
    const charge = await this.chargeRepo.findById(id);

    if (!charge) {
      throw new ChargeNotFoundError(id);
    }

    if (!charge.canBeCanceled()) {
      throw new ChargeCannotBeCanceledError(charge.status);
    }

    const canceled = charge.cancel();
    await this.chargeRepo.update(canceled);

    this.publishEvents(canceled);
  }

  private publishEvents(charge: Charge): void {
    const correlationId = randomUUID();

    this.eventBus.publish(
      new ChargeCanceledEvent(charge.id, correlationId, charge.customerId),
    );

    this.sseService.emit({
      type: 'charge.canceled',
      data: { chargeId: charge.id, status: charge.status },
    });
  }
}
