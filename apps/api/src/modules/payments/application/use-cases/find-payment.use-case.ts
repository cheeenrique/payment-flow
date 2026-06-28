import { Inject, Injectable } from '@nestjs/common';
import type { Payment } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import { NotFoundError } from '@/shared/errors/not-found.error';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

/**
 * Caso de uso: consulta de um pagamento pelo seu ID.
 * Utilizado pela query-side (GraphQL e REST GET /payments/:id).
 */
@Injectable()
export class FindPaymentUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
  ) {}

  async execute(paymentId: string): Promise<Payment> {
    const payment = await this.repo.findById(paymentId);

    if (!payment) {
      throw new NotFoundError('Pagamento não encontrado', undefined, { paymentId });
    }

    return payment;
  }
}
