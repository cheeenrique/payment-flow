import { Inject, Injectable } from '@nestjs/common';
import type { Charge } from '@/modules/charges/domain/entities/charge.entity';
import type {
  IChargeRepository,
  ListChargesFilter,
} from '@/modules/charges/domain/repositories/charge-repository.interface';
import type { PaginatedResult } from '@/shared/pagination/paginated-result.interface';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

export interface ListChargesInput extends ListChargesFilter {
  page: number;
  limit: number;
}

/** Caso de uso: listagem paginada de cobranças com filtros opcionais de status e customerId. */
@Injectable()
export class ListChargesUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
  ) {}

  async execute(input: ListChargesInput): Promise<PaginatedResult<Charge>> {
    const { page, limit, status, customerId } = input;
    const { items, total } = await this.chargeRepo.findAll(
      { status, customerId },
      page,
      limit,
    );
    return { items, total, page, limit };
  }
}
