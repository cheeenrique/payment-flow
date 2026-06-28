import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Charge, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeCreatedEvent } from '@/modules/charges/domain/events/charge-created.event';
import { ChargePaymentRequestedEvent } from '@/modules/charges/domain/events/charge-payment-requested.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

export interface CreateChargeInput {
  customerId: string;
  amount: number;
  paymentMethod: PaymentMethod;
  description?: string;
  expiresAt: Date;
}

export interface CreateChargeOutput {
  id: string;
  customerId: string;
  amount: number;
  currency: string;
  description?: string;
  status: string;
  paymentMethod: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Caso de uso: criação de cobrança.
 * Persiste a entidade, publica charge.created.v1 no RabbitMQ
 * e notifica o dashboard via SSE.
 */
@Injectable()
export class CreateChargeUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(input: CreateChargeInput): Promise<CreateChargeOutput> {
    const charge = Charge.create({
      customerId: input.customerId,
      amount: input.amount,
      currency: 'BRL',
      description: input.description,
      paymentMethod: input.paymentMethod,
      expiresAt: input.expiresAt,
    });

    await this.chargeRepo.create(charge);
    this.publishEvents(charge);

    return this.toOutput(charge);
  }

  private publishEvents(charge: Charge): void {
    const correlationId = randomUUID();

    this.eventBus.publish(
      new ChargeCreatedEvent(charge.id, correlationId, {
        customerId: charge.customerId,
        amount: charge.amount,
        currency: charge.currency,
        paymentMethod: charge.paymentMethod,
        status: charge.status,
        expiresAt: charge.expiresAt,
      }),
    );

    // Charge nasce aguardando pagamento -> solicita o início do fluxo ao Payments.
    // Mesmo correlationId liga charge.created e charge.payment_requested no rastreio.
    this.eventBus.publish(
      new ChargePaymentRequestedEvent(charge.id, correlationId, {
        customerId: charge.customerId,
        amount: charge.amount,
        method: charge.paymentMethod,
      }),
    );

    this.sseService.emit({
      type: 'charge.created',
      data: {
        chargeId: charge.id,
        customerId: charge.customerId,
        status: charge.status,
        amount: charge.amount,
      },
    });
  }

  private toOutput(charge: Charge): CreateChargeOutput {
    return {
      id: charge.id,
      customerId: charge.customerId,
      amount: charge.amount,
      currency: charge.currency,
      description: charge.description,
      status: charge.status,
      paymentMethod: charge.paymentMethod,
      expiresAt: charge.expiresAt,
      createdAt: charge.createdAt,
      updatedAt: charge.updatedAt,
    };
  }
}
