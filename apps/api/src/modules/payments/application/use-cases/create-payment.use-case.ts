import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Payment, type PaymentMethod } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import { PaymentCreatedEvent } from '@/modules/payments/domain/events/payment-created.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

export interface CreatePaymentInput {
  chargeId: string;
  customerId: string;
  amount: number;
  method: PaymentMethod;
  /** Chave de idempotência para evitar duplicações (ex: Idempotency-Key header) */
  idempotencyKey?: string;
  correlationId?: string;
}

export interface CreatePaymentOutput {
  paymentId: string;
  status: string;
  /** Indica se o pagamento já existia (resposta idempotente) */
  deduplicated: boolean;
}

/**
 * Caso de uso: criação de uma tentativa de pagamento.
 * Implementa idempotência via chave: se a chave já existe, retorna o pagamento existente.
 */
@Injectable()
export class CreatePaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(input: CreatePaymentInput): Promise<CreatePaymentOutput> {
    // Verificação de idempotência: evita criar pagamentos duplicados
    if (input.idempotencyKey) {
      const existing = await this.repo.findByIdempotencyKey(input.idempotencyKey);
      if (existing) {
        return { paymentId: existing.id, status: existing.status, deduplicated: true };
      }
    }

    const payment = Payment.create({
      chargeId: input.chargeId,
      customerId: input.customerId,
      amount: input.amount,
      method: input.method,
      idempotencyKey: input.idempotencyKey,
    });

    await this.repo.create(payment);

    const correlationId = input.correlationId ?? randomUUID();

    // Publica evento de integração para demais módulos (timeline, notifications)
    this.eventBus.publish(
      new PaymentCreatedEvent(
        payment.id,
        correlationId,
        payment.chargeId,
        payment.customerId,
        payment.amount,
        payment.method,
      ),
    );

    // Empurra atualização em tempo real via SSE
    this.sseService.emit({
      type: 'payment.created',
      data: {
        id: payment.id,
        paymentId: payment.id,
        chargeId: payment.chargeId,
        customerId: payment.customerId,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
      },
    });

    return { paymentId: payment.id, status: payment.status, deduplicated: false };
  }
}
