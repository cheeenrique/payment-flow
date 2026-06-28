import { DomainError } from '@/shared/errors/domain.error';

/** Lançado quando uma cobrança não é encontrada pelo id informado */
export class ChargeNotFoundError extends DomainError {
  constructor(id: string) {
    super(
      `Cobrança com id "${id}" não encontrada`,
      'CHARGE_NOT_FOUND',
      404,
      undefined,
      { id },
    );
  }
}
