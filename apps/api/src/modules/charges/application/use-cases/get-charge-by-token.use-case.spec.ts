import { GetChargeByTokenUseCase } from './get-charge-by-token.use-case';
import type { PublicChargeView } from './get-charge-by-token.use-case';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';

const ALL_METHODS: PaymentMethod[] = [
  PaymentMethod.PIX,
  PaymentMethod.BOLETO,
  PaymentMethod.CREDIT_CARD,
];

function makeChargeRepo(charge: Charge | null): jest.Mocked<IChargeRepository> {
  return {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findExpirable: jest.fn(),
    countByStatus: jest.fn(),
    findByPaymentLinkToken: jest.fn().mockResolvedValue(charge),
  };
}

function makeCharge(overrides: Partial<{
  description: string | undefined;
  status: ChargeStatus;
}> = {}): Charge {
  return new Charge({
    id: 'charge-internal-uuid',
    customerId: 'customer-internal-uuid',
    amount: 25000,
    currency: 'BRL',
    description: 'Mensalidade de serviço',
    status: ChargeStatus.PENDING,
    paymentLinkToken: 'aaaaaaaabbbbbbbbcccccccc00000001',
    paymentMethod: null,
    expiresAt: new Date(Date.now() + 3600_000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });
}

describe('GetChargeByTokenUseCase', () => {
  describe('token encontrado', () => {
    it('retorna view pública com campos seguros', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect(view.amount).toBe(charge.amount);
      expect(view.currency).toBe(charge.currency);
      expect(view.description).toBe(charge.description);
      expect(view.status).toBe(charge.status);
    });

    it('availableMethods contém sempre os três métodos suportados', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect(view.availableMethods).toEqual(ALL_METHODS);
    });

    it('NÃO expõe id interno', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect((view as unknown as Record<string, unknown>)['id']).toBeUndefined();
    });

    it('NÃO expõe paymentLinkToken', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect((view as unknown as Record<string, unknown>)['paymentLinkToken']).toBeUndefined();
    });

    it('NÃO expõe customerId', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect((view as unknown as Record<string, unknown>)['customerId']).toBeUndefined();
    });

    it('NÃO expõe expiresAt', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect((view as unknown as Record<string, unknown>)['expiresAt']).toBeUndefined();
    });

    it('customerName é undefined (módulo de clientes desacoplado)', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect(view.customerName).toBeUndefined();
    });

    it('busca pelo token informado', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect(chargeRepo.findByPaymentLinkToken).toHaveBeenCalledWith('aaaaaaaabbbbbbbbcccccccc00000001');
    });
  });

  describe('cobrança sem description', () => {
    it('description é undefined na view quando não definida na cobrança', async () => {
      const charge = makeCharge({ description: undefined });
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect(view.description).toBeUndefined();
    });

    it('ainda retorna availableMethods completo mesmo sem description', async () => {
      const charge = makeCharge({ description: undefined });
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      expect(view.availableMethods).toEqual(ALL_METHODS);
    });
  });

  describe('cobrança com paymentMethod pré-definido', () => {
    it('availableMethods contém apenas o método já definido', async () => {
      const charge = new Charge({
        id: 'charge-internal-uuid',
        customerId: 'customer-internal-uuid',
        amount: 25000,
        currency: 'BRL',
        description: 'Mensalidade de serviço',
        status: ChargeStatus.AWAITING_PAYMENT,
        paymentLinkToken: 'aaaaaaaabbbbbbbbcccccccc00000002',
        paymentMethod: PaymentMethod.PIX,
        expiresAt: new Date(Date.now() + 3600_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000002');

      expect(view.availableMethods).toEqual([PaymentMethod.PIX]);
      expect(view.availableMethods).toHaveLength(1);
    });

    it('availableMethods é cópia independente (não a referência do módulo)', async () => {
      const charge = makeCharge();
      const chargeRepo = makeChargeRepo(charge);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const view = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');

      // Mutar o array retornado não deve afetar chamadas futuras
      view.availableMethods.length = 0;
      const view2 = await useCase.execute('aaaaaaaabbbbbbbbcccccccc00000001');
      expect(view2.availableMethods).toHaveLength(3);
    });
  });

  describe('token não encontrado', () => {
    it('lança ChargeNotFoundError quando findByPaymentLinkToken retorna null', async () => {
      const chargeRepo = makeChargeRepo(null);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      await expect(useCase.execute('token-invalido')).rejects.toThrow(ChargeNotFoundError);
    });

    it('não retorna nada quando token não existe', async () => {
      const chargeRepo = makeChargeRepo(null);
      const useCase = new GetChargeByTokenUseCase(chargeRepo);

      const result = await useCase.execute('token-invalido').catch((e: unknown) => e);

      expect(result).toBeInstanceOf(ChargeNotFoundError);
    });
  });
});
