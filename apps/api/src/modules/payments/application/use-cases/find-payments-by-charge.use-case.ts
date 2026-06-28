import { Inject, Injectable } from '@nestjs/common';
import type { Payment } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

export interface FindPaymentsByChargeInput {
  chargeId: string;
  page: number;
  limit: number;
}

/**
 * Caso de uso: lista pagamentos vinculados a uma cobrança com paginação.
 * Utilizado pela query-side (GraphQL e REST GET /charges/:id/payments).
 */
@Injectable()
export class FindPaymentsByChargeUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
  ) {}

  async execute(input: FindPaymentsByChargeInput): Promise<PaginatedResult<Payment>> {
    const { chargeId, page, limit } = input;
    const { items, total } = await this.repo.findByChargeId(chargeId, page, limit);
    return { items, total, page, limit };
  }
}
