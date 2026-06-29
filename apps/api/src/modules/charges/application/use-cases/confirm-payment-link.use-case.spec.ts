import { ConfirmPaymentLinkUseCase } from './confirm-payment-link.use-case';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { ConflictError } from '@/shared/errors/conflict.error';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';

function makeMocks() {
  const chargeRepo: jest.Mocked<IChargeRepository> = {
    create: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    findExpirable: jest.fn(),
    countByStatus: jest.fn(),
    findByPaymentLinkToken: jest.fn(),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  return { chargeRepo, eventBus };
}

function makePendingCharge(): Charge {
  return new Charge({
    id: 'charge-uuid-001',
    customerId: 'customer-uuid-001',
    amount: 15000,
    currency: 'BRL',
    description: 'Cobrança de teste',
    status: ChargeStatus.PENDING,
    paymentLinkToken: 'aaaaaaaabbbbbbbbcccccccc00000001',
    paymentMethod: null,
    expiresAt: new Date(Date.now() + 3600_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

function makeTerminalCharge(status: ChargeStatus): Charge {
  return new Charge({
    id: 'charge-uuid-002',
    customerId: 'customer-uuid-002',
    amount: 20000,
    currency: 'BRL',
    description: 'Cobrança terminal',
    status,
    paymentLinkToken: 'aaaaaaaabbbbbbbbcccccccc00000002',
    paymentMethod: null,
    expiresAt: new Date(Date.now() + 3600_000),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

describe('ConfirmPaymentLinkUseCase', () => {
  describe('cobrança pending → sucesso', () => {
    it('persiste a cobrança atualizada via chargeRepo.update', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makePendingCharge();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX });

      expect(chargeRepo.update).toHaveBeenCalledTimes(1);
      expect(chargeRepo.update).toHaveBeenCalledWith(expect.any(Charge));
    });

    it('emite charge.payment_requested.v1 exatamente uma vez', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makePendingCharge();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX });

      const publishCalls = (eventBus.publish as jest.Mock).mock.calls as [{ type: string }][];
      const requestedCalls = publishCalls.filter(([e]) => e.type === 'charge.payment_requested.v1');
      expect(requestedCalls).toHaveLength(1);
    });

    it('payload do evento contém customerId, amount e method', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makePendingCharge();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX });

      const [publishedEvent] = (eventBus.publish as jest.Mock).mock.calls[0] as [{ payload: Record<string, unknown> }];
      expect(publishedEvent.payload).toMatchObject({
        customerId: charge.customerId,
        amount: charge.amount,
        method: PaymentMethod.PIX,
      });
    });

    it('retorna status awaiting_payment', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makePendingCharge();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      const result = await useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX });

      expect(result).toEqual({ status: ChargeStatus.AWAITING_PAYMENT });
    });

    it('funciona com método BOLETO', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makePendingCharge();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      const result = await useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.BOLETO });

      expect(result).toEqual({ status: ChargeStatus.AWAITING_PAYMENT });
      const [publishedEvent] = (eventBus.publish as jest.Mock).mock.calls[0] as [{ payload: Record<string, unknown> }];
      expect(publishedEvent.payload).toMatchObject({ method: PaymentMethod.BOLETO });
    });
  });

  describe('cobrança terminal → ConflictError', () => {
    it('lança ConflictError quando cobrança está paga', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makeTerminalCharge(ChargeStatus.PAID);
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await expect(
        useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX }),
      ).rejects.toThrow(ConflictError);
    });

    it('lança ConflictError quando cobrança está cancelada', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makeTerminalCharge(ChargeStatus.CANCELED);
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await expect(
        useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX }),
      ).rejects.toThrow(ConflictError);
    });

    it('não persiste nem emite evento quando cobrança é terminal', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      const charge = makeTerminalCharge(ChargeStatus.EXPIRED);
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(charge);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await useCase.execute({ token: charge.paymentLinkToken, method: PaymentMethod.PIX }).catch(() => undefined);

      expect(chargeRepo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('token não encontrado → ChargeNotFoundError', () => {
    it('lança ChargeNotFoundError quando findByPaymentLinkToken retorna null', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(null);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await expect(
        useCase.execute({ token: 'token-inexistente', method: PaymentMethod.PIX }),
      ).rejects.toThrow(ChargeNotFoundError);
    });

    it('não persiste nem emite evento quando token não existe', async () => {
      const { chargeRepo, eventBus } = makeMocks();
      chargeRepo.findByPaymentLinkToken.mockResolvedValue(null);
      const useCase = new ConfirmPaymentLinkUseCase(chargeRepo, eventBus);

      await useCase.execute({ token: 'token-inexistente', method: PaymentMethod.PIX }).catch(() => undefined);

      expect(chargeRepo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });
});
