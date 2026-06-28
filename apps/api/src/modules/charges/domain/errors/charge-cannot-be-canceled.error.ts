import { DomainError } from '@/shared/errors/domain.error';

/** Lançado quando a cobrança está em estado que não permite cancelamento */
export class ChargeCannotBeCanceledError extends DomainError {
  constructor(currentStatus: string) {
    super(
      `Cobrança com status "${currentStatus}" não pode ser cancelada`,
      'CHARGE_CANNOT_BE_CANCELED',
      422,
      undefined,
      { currentStatus },
    );
  }
}
