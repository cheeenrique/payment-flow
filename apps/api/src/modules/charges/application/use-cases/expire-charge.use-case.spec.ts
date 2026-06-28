import { ExpireChargeUseCase } from './expire-charge.use-case';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { ChargeCannotExpireError } from '@/modules/charges/domain/errors/charge-cannot-expire.error';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';
import type { SseService } from '@/infra/sse/sse.service';

const baseChargeProps = {
  customerId: 'customer-uuid',
  amount: 10000,
  currency: 'BRL',
  paymentMethod: PaymentMethod.PIX as PaymentMethod | null,
  paymentLinkToken: 'aaaaaaaabbbbbbbbcccccccc00000001',
  expiresAt: new Date(Date.now() - 3600_000), // vencida há 1 hora
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeChargeWithStatus(status: ChargeStatus): Charge {
  return new Charge({ id: 'charge-uuid', ...baseChargeProps, status });
}

function makeMocks(chargeFake: Charge | null = null) {
  const chargeRepo: jest.Mocked<IChargeRepository> = {
    create: jest.fn(),
    findById: jest.fn().mockResolvedValue(chargeFake),
    findAll: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    findExpirable: jest.fn(),
    countByStatus: jest.fn().mockResolvedValue({}),
    findByPaymentLinkToken: jest.fn(),
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

describe('ExpireChargeUseCase', () => {
  describe('cobrança inexistente', () => {
    it('lança ChargeNotFoundError quando a cobrança não é encontrada', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks(null);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await expect(useCase.execute('id-inexistente')).rejects.toThrow(ChargeNotFoundError);
    });

    it('não persiste nem publica evento quando cobrança não existe', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks(null);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute('id-inexistente').catch(() => undefined);

      expect(chargeRepo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(sseService.emit).not.toHaveBeenCalled();
    });

    it('ChargeNotFoundError carrega o id buscado no context', async () => {
      const { chargeRepo, eventBus, sseService } = makeMocks(null);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      const err = await useCase.execute('id-invalido').catch((e) => e);

      expect(err).toBeInstanceOf(ChargeNotFoundError);
      expect(err.context).toEqual(expect.objectContaining({ id: 'id-invalido' }));
    });
  });

  describe('cobrança em estado terminal — idempotência (não reexpira)', () => {
    it.each([
      ChargeStatus.PAID,
      ChargeStatus.CANCELED,
      ChargeStatus.EXPIRED,
      ChargeStatus.FAILED,
    ])('lança ChargeCannotExpireError para status "%s"', async (status) => {
      const charge = makeChargeWithStatus(status);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await expect(useCase.execute(charge.id)).rejects.toThrow(ChargeCannotExpireError);
    });

    it('não persiste nem publica evento quando cobrança já está expirada', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.EXPIRED);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(charge.id).catch(() => undefined);

      expect(chargeRepo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(sseService.emit).not.toHaveBeenCalled();
    });
  });

  describe('expiração bem-sucedida', () => {
    it('persiste cobrança com status expired a partir de pending', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.PENDING);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(charge.id);

      expect(chargeRepo.update).toHaveBeenCalledTimes(1);
      expect(chargeRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: ChargeStatus.EXPIRED }),
      );
    });

    it('persiste cobrança com status expired a partir de awaiting_payment', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.AWAITING_PAYMENT);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(charge.id);

      expect(chargeRepo.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: ChargeStatus.EXPIRED }),
      );
    });

    it('publica evento charge.expired.v1 no eventBus após persistir', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.PENDING);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(charge.id);

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'charge.expired.v1' }),
      );
    });

    it('emite evento SSE com tipo charge.expired', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.PENDING);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(charge.id);

      expect(sseService.emit).toHaveBeenCalledTimes(1);
      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'charge.expired' }),
      );
    });

    it('SSE carrega chargeId e status expired no payload', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.PENDING);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await useCase.execute(charge.id);

      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'charge.expired',
          data: expect.objectContaining({
            chargeId: charge.id,
            status: ChargeStatus.EXPIRED,
          }),
        }),
      );
    });

    it('resolve sem retorno (void)', async () => {
      const charge = makeChargeWithStatus(ChargeStatus.PENDING);
      const { chargeRepo, eventBus, sseService } = makeMocks(charge);
      const useCase = new ExpireChargeUseCase(chargeRepo, eventBus, sseService);

      await expect(useCase.execute(charge.id)).resolves.toBeUndefined();
    });
  });
});
