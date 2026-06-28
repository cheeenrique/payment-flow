import { CreateChargeUseCase } from './create-charge.use-case';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';
import type { SseService } from '@/infra/sse/sse.service';

function makeMocks() {
  const chargeRepo: jest.Mocked<IChargeRepository> = {
    create: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findExpirable: jest.fn(),
    countByStatus: jest.fn(),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  const sseService = {
    emit: jest.fn(),
    stream: jest.fn(),
  } as unknown as jest.Mocked<SseService>;

  return { chargeRepo, eventBus, sseService };
}

const baseInput = {
  customerId: 'customer-uuid',
  amount: 10000,
  description: 'Cobrança de teste',
  expiresAt: new Date(Date.now() + 3600_000),
};

describe('CreateChargeUseCase', () => {
  describe('persistência', () => {
    it('persiste a cobrança via chargeRepo.create', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(baseInput);

      expect(chargeRepo.create).toHaveBeenCalledTimes(1);
      expect(chargeRepo.create).toHaveBeenCalledWith(expect.any(Charge));
    });

    it('persiste cobrança com status pending', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(baseInput);

      const [saved] = (chargeRepo.create as jest.Mock).mock.calls[0] as [Charge];
      expect(saved.status).toBe(ChargeStatus.PENDING);
    });

    it('persiste cobrança sem método de pagamento quando paymentMethod omitido', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(baseInput);

      const [saved] = (chargeRepo.create as jest.Mock).mock.calls[0] as [Charge];
      expect(saved.paymentMethod).toBeNull();
    });

    it('persiste cobrança sem método quando paymentMethod explicitamente null', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute({ ...baseInput, paymentMethod: null });

      const [saved] = (chargeRepo.create as jest.Mock).mock.calls[0] as [Charge];
      expect(saved.paymentMethod).toBeNull();
    });

    it('persiste cobrança com paymentMethod quando fornecido', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute({ ...baseInput, paymentMethod: PaymentMethod.PIX });

      const [saved] = (chargeRepo.create as jest.Mock).mock.calls[0] as [Charge];
      expect(saved.paymentMethod).toBe(PaymentMethod.PIX);
    });
  });

  describe('eventos', () => {
    it('emite charge.created.v1 exatamente uma vez', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(baseInput);

      const publishCalls = (eventBus.publish as jest.Mock).mock.calls as [{ type: string }][];
      const createdCalls = publishCalls.filter(([e]) => e.type === 'charge.created.v1');
      expect(createdCalls).toHaveLength(1);
    });

    it('NUNCA emite charge.payment_requested.v1 no create', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(baseInput);

      const publishCalls = (eventBus.publish as jest.Mock).mock.calls as [{ type: string }][];
      const requestedCalls = publishCalls.filter(([e]) => e.type === 'charge.payment_requested.v1');
      expect(requestedCalls).toHaveLength(0);
    });

    it('não chama eventBus.publish com charge.payment_requested.v1 mesmo com paymentMethod fornecido', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute({ ...baseInput, paymentMethod: PaymentMethod.CREDIT_CARD });

      const publishCalls = (eventBus.publish as jest.Mock).mock.calls as [{ type: string }][];
      const requestedCalls = publishCalls.filter(([e]) => e.type === 'charge.payment_requested.v1');
      expect(requestedCalls).toHaveLength(0);
    });

    it('emite evento SSE do tipo charge.created', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(baseInput);

      expect(sseService.emit).toHaveBeenCalledTimes(1);
      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'charge.created' }),
      );
    });
  });

  describe('output', () => {
    it('retorna paymentLinkToken no output', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      const result = await useCase.execute(baseInput);

      expect(result.paymentLinkToken).toBeDefined();
      expect(typeof result.paymentLinkToken).toBe('string');
      expect(result.paymentLinkToken.length).toBeGreaterThan(0);
    });

    it('paymentLinkToken do output bate com o da cobrança persistida', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      const result = await useCase.execute(baseInput);

      const [saved] = (chargeRepo.create as jest.Mock).mock.calls[0] as [Charge];
      expect(result.paymentLinkToken).toBe(saved.paymentLinkToken);
    });

    it('retorna os campos básicos da cobrança', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      const result = await useCase.execute(baseInput);

      expect(result).toMatchObject({
        customerId: baseInput.customerId,
        amount: baseInput.amount,
        currency: 'BRL',
        status: ChargeStatus.PENDING,
        paymentMethod: null,
      });
    });

    it('retorna id e timestamps', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks();
      const useCase = new CreateChargeUseCase(chargeRepo, eventBus, sseService);

      const result = await useCase.execute(baseInput);

      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });
  });
});
