import { DomainError } from '@/shared/errors/domain.error';

/** Lançado quando a cobrança está em estado que não permite expiração */
export class ChargeCannotExpireError extends DomainError {
  constructor(currentStatus: string) {
    super(
      `Cobrança com status "${currentStatus}" não pode ser expirada`,
      'CHARGE_CANNOT_EXPIRE',
      422,
      undefined,
      { currentStatus },
    );
  }
}
