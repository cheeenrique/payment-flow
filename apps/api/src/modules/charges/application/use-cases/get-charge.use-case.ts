import { Inject, Injectable } from '@nestjs/common';
import type { Charge } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';

/** Caso de uso: busca de cobrança por ID. Usado pelo REST e pelo GraphQL resolver. */
@Injectable()
export class GetChargeUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
  ) {}

  async execute(id: string): Promise<Charge> {
    const charge = await this.chargeRepo.findById(id);

    if (!charge) {
      throw new ChargeNotFoundError(id);
    }

    return charge;
  }
}
