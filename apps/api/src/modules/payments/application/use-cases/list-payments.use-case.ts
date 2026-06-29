import { Inject, Injectable } from '@nestjs/common';
import type { Payment } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';

export interface ListPaymentsInput {
  page: number;
  limit: number;
}

/**
 * Caso de uso: lista todos os pagamentos do sistema, paginados por mais recentes.
 * Utilizado pelo endpoint GET /payments (acesso autenticado, permissão PaymentsRead).
 */
@Injectable()
export class ListPaymentsUseCase {
  constructor(
    @Inject(PAYMENT_REPOSITORY) private readonly repo: IPaymentRepository,
  ) {}

  async execute(input: ListPaymentsInput): Promise<PaginatedResult<Payment>> {
    const { page, limit } = input;
    const { items, total } = await this.repo.findMany(page, limit);
    return { items, total, page, limit };
  }
}
