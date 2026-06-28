import { Payment } from './payment.entity';
import { ConflictError } from '@/shared/errors/conflict.error';

const baseCreateProps = {
  chargeId: 'charge-uuid',
  customerId: 'customer-uuid',
  amount: 5000,
  method: 'pix' as const,
};

function criarPagamento(overrides: Partial<typeof baseCreateProps> = {}): Payment {
  return Payment.create({ ...baseCreateProps, ...overrides });
}

describe('Payment.create', () => {
  it('cria pagamento com status inicial pending', () => {
    const payment = criarPagamento();

    expect(payment.status).toBe('pending');
  });

  it('gera id único (uuid) em cada criação', () => {
    const p1 = criarPagamento();
    const p2 = criarPagamento();

    expect(p1.id).toBeTruthy();
    expect(p1.id).not.toBe(p2.id);
  });

  it('define createdAt e updatedAt como Date', () => {
    const payment = criarPagamento();

    expect(payment.createdAt).toBeInstanceOf(Date);
    expect(payment.updatedAt).toBeInstanceOf(Date);
  });

  it('preserva amount, method, chargeId e customerId fornecidos', () => {
    const payment = criarPagamento();

    expect(payment.amount).toBe(5000);
    expect(payment.method).toBe('pix');
    expect(payment.chargeId).toBe(baseCreateProps.chargeId);
    expect(payment.customerId).toBe(baseCreateProps.customerId);
  });
});

describe('Payment.startProcessing', () => {
  it('transita de pending para processing com sucesso', () => {
    const payment = criarPagamento();
    const processing = payment.startProcessing();

    expect(processing.status).toBe('processing');
  });

  it('não muta a instância original', () => {
    const payment = criarPagamento();
    const processing = payment.startProcessing();

    expect(payment.status).toBe('pending');
    expect(processing).not.toBe(payment);
  });

  it('lança ConflictError ao tentar iniciar processamento a partir de processing', () => {
    const payment = criarPagamento().startProcessing();

    expect(() => payment.startProcessing()).toThrow(ConflictError);
  });

  it('lança ConflictError ao tentar iniciar processamento a partir de approved', () => {
    const payment = criarPagamento().startProcessing().approve();

    expect(() => payment.startProcessing()).toThrow(ConflictError);
  });

  it('ConflictError carrega o status atual no context', () => {
    const payment = criarPagamento().startProcessing();

    expect(() => payment.startProcessing()).toThrow(
      expect.objectContaining({
        code: 'CONFLICT',
        context: expect.objectContaining({ currentStatus: 'processing' }),
      }),
    );
  });
});

describe('Payment.approve', () => {
  it('transita de processing para approved com sucesso', () => {
    const payment = criarPagamento().startProcessing();
    const approved = payment.approve();

    expect(approved.status).toBe('approved');
  });

  it('persiste providerResponse quando fornecida', () => {
    const response = { psp: 'ok', txId: 'pix-123' };
    const approved = criarPagamento().startProcessing().approve(response);

    expect(approved.providerResponse).toEqual(response);
  });

  it('não muta a instância original', () => {
    const processing = criarPagamento().startProcessing();
    const approved = processing.approve();

    expect(processing.status).toBe('processing');
    expect(approved).not.toBe(processing);
  });

  it('lança ConflictError ao tentar aprovar a partir de pending (fora de ordem)', () => {
    const payment = criarPagamento();

    expect(() => payment.approve()).toThrow(ConflictError);
  });

  it('lança ConflictError ao tentar aprovar a partir de approved', () => {
    const payment = criarPagamento().startProcessing().approve();

    expect(() => payment.approve()).toThrow(ConflictError);
  });
});

describe('Payment.fail', () => {
  it('transita de processing para failed com motivo informado', () => {
    const payment = criarPagamento().startProcessing();
    const failed = payment.fail('saldo insuficiente');

    expect(failed.status).toBe('failed');
    expect(failed.failureReason).toBe('saldo insuficiente');
  });

  it('não muta a instância original', () => {
    const processing = criarPagamento().startProcessing();
    const failed = processing.fail('motivo');

    expect(processing.status).toBe('processing');
    expect(failed).not.toBe(processing);
  });

  it('lança ConflictError ao tentar falhar a partir de pending', () => {
    const payment = criarPagamento();

    expect(() => payment.fail('motivo')).toThrow(ConflictError);
  });

  it('lança ConflictError ao tentar falhar a partir de approved', () => {
    const payment = criarPagamento().startProcessing().approve();

    expect(() => payment.fail('motivo')).toThrow(ConflictError);
  });
});

describe('Payment.isTerminal', () => {
  it('retorna false para status pending', () => {
    expect(criarPagamento().isTerminal()).toBe(false);
  });

  it('retorna false para status processing', () => {
    expect(criarPagamento().startProcessing().isTerminal()).toBe(false);
  });

  it('retorna true para status approved', () => {
    expect(criarPagamento().startProcessing().approve().isTerminal()).toBe(true);
  });

  it('retorna true para status failed', () => {
    expect(criarPagamento().startProcessing().fail('razão').isTerminal()).toBe(true);
  });
});
