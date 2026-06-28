import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Payment } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import { PaymentProcessingEvent } from '@/modules/payments/domain/events/payment-processing.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { NotFoundError } from '@/shared/errors/not-found.error';
import { ConflictError } from '@/shared/errors/conflict.error';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

/**
 * Caso de uso: inicia o processamento de um pagamento.
 *
 * Responsabilidade única: transicionar o pagamento de "pending" para "processing"
 * e publicar payment.processing.v1. A decisão de aprovação ou recusa fica
 * exclusivamente com o simulador (PSP artificial) — sem Math.random aqui.
 *
 * A resolução do fluxo volta via simulator.payment.approved/failed.v1
 * consumido pelo SimulatorVerdictConsumer.
 */
@Injectable()
export class ProcessPaymentUseCase {
  private readonly logger = new Logger(ProcessPaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(paymentId: string, correlationId: string): Promise<void> {
    const payment = await this.repo.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Pagamento não encontrado', undefined, { paymentId });
    }

    if (payment.isTerminal()) {
      throw new ConflictError('Pagamento já foi processado', undefined, {
        paymentId,
        status: payment.status,
      });
    }

    await this.transitionToProcessing(payment, correlationId);
  }

  /** Transiciona o pagamento para "processing" e dispara o evento para o simulador */
  private async transitionToProcessing(payment: Payment, correlationId: string): Promise<void> {
    const processing = payment.startProcessing();
    await this.repo.update(processing);

    this.eventBus.publish(
      new PaymentProcessingEvent(
        processing.id,
        correlationId,
        processing.chargeId,
        processing.customerId,
        processing.amount,
        processing.method,
      ),
    );

    this.sseService.emit({
      type: 'payment.processing',
      data: { paymentId: processing.id, chargeId: processing.chargeId, status: 'processing' },
    });

    this.logger.log(
      `Pagamento [${processing.id}] em processamento — aguardando veredito do simulador`,
    );
  }
}
