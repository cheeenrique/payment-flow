import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Charge } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { ChargeCannotExpireError } from '@/modules/charges/domain/errors/charge-cannot-expire.error';
import { ChargeExpiredEvent } from '@/modules/charges/domain/events/charge-expired.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/**
 * Caso de uso: expiração de cobrança.
 * Chamado pelo Simulator ou por um scheduler externo.
 * Publica charge.expired.v1 após persistir o novo estado.
 */
@Injectable()
export class ExpireChargeUseCase {
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

    if (!charge.canExpire()) {
      throw new ChargeCannotExpireError(charge.status);
    }

    const expired = charge.expire();
    await this.chargeRepo.update(expired);

    this.publishEvents(expired);
  }

  private publishEvents(charge: Charge): void {
    const correlationId = randomUUID();

    this.eventBus.publish(
      new ChargeExpiredEvent(charge.id, correlationId, charge.customerId),
    );

    this.sseService.emit({
      type: 'charge.expired',
      data: { chargeId: charge.id, status: charge.status },
    });
  }
}
