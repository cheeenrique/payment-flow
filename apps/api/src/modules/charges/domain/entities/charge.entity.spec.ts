import { Charge, ChargeStatus, PaymentMethod } from './charge.entity';
import { ConflictError } from '@/shared/errors/conflict.error';

const baseProps = {
  customerId: 'customer-uuid',
  amount: 10000,
  currency: 'BRL',
  description: 'Cobrança de teste',
  paymentMethod: PaymentMethod.PIX,
  expiresAt: new Date(Date.now() + 86_400_000), // +1 dia
};

function criarCobranca(overrides: Partial<typeof baseProps> = {}): Charge {
  return Charge.create({ ...baseProps, ...overrides });
}

describe('Charge.create', () => {
  it('cria cobrança com status inicial pending', () => {
    const charge = criarCobranca();

    expect(charge.status).toBe(ChargeStatus.PENDING);
  });

  it('gera id único (uuid) em cada criação', () => {
    const c1 = criarCobranca();
    const c2 = criarCobranca();

    expect(c1.id).toBeTruthy();
    expect(c1.id).not.toBe(c2.id);
  });

  it('define createdAt e updatedAt como Date', () => {
    const charge = criarCobranca();

    expect(charge.createdAt).toBeInstanceOf(Date);
    expect(charge.updatedAt).toBeInstanceOf(Date);
  });

  it('preserva amount, currency e description fornecidos', () => {
    const charge = criarCobranca();

    expect(charge.amount).toBe(10000);
    expect(charge.currency).toBe('BRL');
    expect(charge.description).toBe('Cobrança de teste');
  });
});

describe('Charge.isTerminal', () => {
  it('retorna false para status pending', () => {
    const charge = criarCobranca();
    expect(charge.isTerminal()).toBe(false);
  });

  it.each([
    ChargeStatus.PAID,
    ChargeStatus.CANCELED,
    ChargeStatus.EXPIRED,
    ChargeStatus.FAILED,
  ])('retorna true para status terminal: %s', (status) => {
    const charge = new Charge({ ...baseProps, id: 'id', status, createdAt: new Date(), updatedAt: new Date() });
    expect(charge.isTerminal()).toBe(true);
  });
});

describe('Charge.canBeCanceled', () => {
  it('retorna true para status pending', () => {
    const charge = criarCobranca();
    expect(charge.canBeCanceled()).toBe(true);
  });

  it('retorna true para status awaiting_payment', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.AWAITING_PAYMENT, createdAt: new Date(), updatedAt: new Date() });
    expect(charge.canBeCanceled()).toBe(true);
  });

  it('retorna false para status terminal paid', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.PAID, createdAt: new Date(), updatedAt: new Date() });
    expect(charge.canBeCanceled()).toBe(false);
  });
});

describe('Charge.markAsPaid', () => {
  it('transita de pending para paid com sucesso', () => {
    const charge = criarCobranca();
    const paid = charge.markAsPaid();

    expect(paid.status).toBe(ChargeStatus.PAID);
  });

  it('transita de awaiting_payment para paid com sucesso', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.AWAITING_PAYMENT, createdAt: new Date(), updatedAt: new Date() });
    const paid = charge.markAsPaid();

    expect(paid.status).toBe(ChargeStatus.PAID);
  });

  it('não muta a instância original', () => {
    const charge = criarCobranca();
    const paid = charge.markAsPaid();

    expect(charge.status).toBe(ChargeStatus.PENDING);
    expect(paid).not.toBe(charge);
  });

  it('renova updatedAt na transição', () => {
    const before = new Date();
    const charge = criarCobranca();
    const paid = charge.markAsPaid();

    expect(paid.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it('lança ConflictError se a cobrança já está em estado terminal', () => {
    const paidCharge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.PAID, createdAt: new Date(), updatedAt: new Date() });

    expect(() => paidCharge.markAsPaid()).toThrow(ConflictError);
  });

  it('ConflictError carrega o status atual no context', () => {
    const failedCharge = new Charge({ ...baseProps, id: 'test-id', status: ChargeStatus.FAILED, createdAt: new Date(), updatedAt: new Date() });

    expect(() => failedCharge.markAsPaid()).toThrow(
      expect.objectContaining({ code: 'CONFLICT', context: expect.objectContaining({ currentStatus: ChargeStatus.FAILED }) }),
    );
  });
});

describe('Charge.markAsFailed', () => {
  it('transita de pending para failed com sucesso', () => {
    const charge = criarCobranca();
    const failed = charge.markAsFailed();

    expect(failed.status).toBe(ChargeStatus.FAILED);
  });

  it('não muta a instância original', () => {
    const charge = criarCobranca();
    const failed = charge.markAsFailed();

    expect(charge.status).toBe(ChargeStatus.PENDING);
    expect(failed).not.toBe(charge);
  });

  it('lança ConflictError ao tentar marcar como falha uma cobrança terminal', () => {
    const canceledCharge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.CANCELED, createdAt: new Date(), updatedAt: new Date() });

    expect(() => canceledCharge.markAsFailed()).toThrow(ConflictError);
  });
});

describe('Charge.cancel', () => {
  it('transita de pending para canceled sem guarda (uso interno)', () => {
    const charge = criarCobranca();
    const canceled = charge.cancel();

    expect(canceled.status).toBe(ChargeStatus.CANCELED);
  });

  it('não muta a instância original', () => {
    const charge = criarCobranca();
    charge.cancel();

    expect(charge.status).toBe(ChargeStatus.PENDING);
  });
});

describe('Charge.canExpire', () => {
  it('retorna true para status pending', () => {
    const charge = criarCobranca();

    expect(charge.canExpire()).toBe(true);
  });

  it('retorna true para status awaiting_payment', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.AWAITING_PAYMENT, createdAt: new Date(), updatedAt: new Date() });

    expect(charge.canExpire()).toBe(true);
  });

  it.each([
    ChargeStatus.PAID,
    ChargeStatus.CANCELED,
    ChargeStatus.EXPIRED,
    ChargeStatus.FAILED,
  ])('retorna false para status terminal: %s', (status) => {
    const charge = new Charge({ ...baseProps, id: 'id', status, createdAt: new Date(), updatedAt: new Date() });

    expect(charge.canExpire()).toBe(false);
  });
});

describe('Charge.expire', () => {
  it('transita de pending para expired sem guarda (uso interno via use case)', () => {
    const charge = criarCobranca();
    const expired = charge.expire();

    expect(expired.status).toBe(ChargeStatus.EXPIRED);
  });

  it('transita de awaiting_payment para expired', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.AWAITING_PAYMENT, createdAt: new Date(), updatedAt: new Date() });
    const expired = charge.expire();

    expect(expired.status).toBe(ChargeStatus.EXPIRED);
  });

  it('não muta a instância original', () => {
    const charge = criarCobranca();
    const expired = charge.expire();

    expect(charge.status).toBe(ChargeStatus.PENDING);
    expect(expired).not.toBe(charge);
  });

  it('renova updatedAt na transição', () => {
    const before = new Date();
    const charge = criarCobranca();
    const expired = charge.expire();

    expect(expired.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

describe('Charge.markAsExpired', () => {
  it('transita de pending para expired com guarda', () => {
    const charge = criarCobranca();
    const expired = charge.markAsExpired();

    expect(expired.status).toBe(ChargeStatus.EXPIRED);
  });

  it('transita de awaiting_payment para expired', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.AWAITING_PAYMENT, createdAt: new Date(), updatedAt: new Date() });
    const expired = charge.markAsExpired();

    expect(expired.status).toBe(ChargeStatus.EXPIRED);
  });

  it('não muta a instância original', () => {
    const charge = criarCobranca();
    const expired = charge.markAsExpired();

    expect(charge.status).toBe(ChargeStatus.PENDING);
    expect(expired).not.toBe(charge);
  });

  it('lança ConflictError se a cobrança já está expirada', () => {
    const charge = new Charge({ ...baseProps, id: 'id', status: ChargeStatus.EXPIRED, createdAt: new Date(), updatedAt: new Date() });

    expect(() => charge.markAsExpired()).toThrow(ConflictError);
  });

  it.each([
    ChargeStatus.PAID,
    ChargeStatus.CANCELED,
    ChargeStatus.FAILED,
  ])('lança ConflictError para qualquer outro estado terminal: %s', (status) => {
    const charge = new Charge({ ...baseProps, id: 'id', status, createdAt: new Date(), updatedAt: new Date() });

    expect(() => charge.markAsExpired()).toThrow(ConflictError);
  });

  it('ConflictError carrega o status atual no context', () => {
    const charge = new Charge({ ...baseProps, id: 'test-id', status: ChargeStatus.PAID, createdAt: new Date(), updatedAt: new Date() });

    expect(() => charge.markAsExpired()).toThrow(
      expect.objectContaining({ code: 'CONFLICT', context: expect.objectContaining({ currentStatus: ChargeStatus.PAID }) }),
    );
  });
});
