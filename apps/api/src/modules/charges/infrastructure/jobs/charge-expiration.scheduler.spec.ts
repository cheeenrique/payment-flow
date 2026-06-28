import { ChargeExpirationScheduler } from './charge-expiration.scheduler';
import { ExpireChargeUseCase } from '@/modules/charges/application/use-cases/expire-charge.use-case';
import { ChargeCannotExpireError } from '@/modules/charges/domain/errors/charge-cannot-expire.error';
import { ChargeNotFoundError } from '@/modules/charges/domain/errors/charge-not-found.error';
import { Charge, ChargeStatus, PaymentMethod } from '@/modules/charges/domain/entities/charge.entity';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';

/** Limite de lote conforme a implementação do scheduler */
const BATCH_LIMIT = 100;

const baseChargeProps = {
  customerId: 'customer-uuid',
  amount: 10000,
  currency: 'BRL',
  paymentMethod: PaymentMethod.PIX,
  expiresAt: new Date(Date.now() - 3600_000),
  status: ChargeStatus.PENDING,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeCharge(id = 'charge-uuid'): Charge {
  return new Charge({ id, ...baseChargeProps });
}

function makeMocks(chargesFake: Charge[] = []) {
  const chargeRepo: jest.Mocked<IChargeRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    update: jest.fn(),
    findExpirable: jest.fn().mockResolvedValue(chargesFake),
    countByStatus: jest.fn().mockResolvedValue({}),
  };

  const expireChargeUseCase = {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<ExpireChargeUseCase>;

  return { chargeRepo, expireChargeUseCase };
}

describe('ChargeExpirationScheduler', () => {
  describe('lote vazio', () => {
    it('não chama expireChargeUseCase quando não há cobranças vencidas', async () => {
      const { chargeRepo, expireChargeUseCase } = makeMocks([]);
      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await scheduler.expirarCobrancastVencidas();

      expect(expireChargeUseCase.execute).not.toHaveBeenCalled();
    });

    it('consulta o repositório com data atual e o limite de lote', async () => {
      const { chargeRepo, expireChargeUseCase } = makeMocks([]);
      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await scheduler.expirarCobrancastVencidas();

      expect(chargeRepo.findExpirable).toHaveBeenCalledTimes(1);
      expect(chargeRepo.findExpirable).toHaveBeenCalledWith(expect.any(Date), BATCH_LIMIT);
    });

    it('resolve sem erro quando o repositório retorna lista vazia', async () => {
      const { chargeRepo, expireChargeUseCase } = makeMocks([]);
      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await expect(scheduler.expirarCobrancastVencidas()).resolves.toBeUndefined();
    });
  });

  describe('processamento do lote', () => {
    it('chama expireChargeUseCase.execute para cada cobrança do lote', async () => {
      const charges = [makeCharge('id-1'), makeCharge('id-2'), makeCharge('id-3')];
      const { chargeRepo, expireChargeUseCase } = makeMocks(charges);
      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await scheduler.expirarCobrancastVencidas();

      expect(expireChargeUseCase.execute).toHaveBeenCalledTimes(3);
      expect(expireChargeUseCase.execute).toHaveBeenCalledWith('id-1');
      expect(expireChargeUseCase.execute).toHaveBeenCalledWith('id-2');
      expect(expireChargeUseCase.execute).toHaveBeenCalledWith('id-3');
    });

    it('falha com ChargeCannotExpireError num item não bloqueia os demais (Promise.allSettled)', async () => {
      const charges = [makeCharge('id-ok'), makeCharge('id-race'), makeCharge('id-outro-ok')];
      const { chargeRepo, expireChargeUseCase } = makeMocks(charges);

      // Simula race condition: cobrança já transitada entre consulta e expiração
      expireChargeUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new ChargeCannotExpireError('expired'))
        .mockResolvedValueOnce(undefined);

      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await expect(scheduler.expirarCobrancastVencidas()).resolves.toBeUndefined();
      expect(expireChargeUseCase.execute).toHaveBeenCalledTimes(3);
    });

    it('falha com ChargeNotFoundError num item não bloqueia os demais', async () => {
      const charges = [makeCharge('id-ok'), makeCharge('id-sumiu')];
      const { chargeRepo, expireChargeUseCase } = makeMocks(charges);

      expireChargeUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new ChargeNotFoundError('id-sumiu'));

      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await expect(scheduler.expirarCobrancastVencidas()).resolves.toBeUndefined();
      expect(expireChargeUseCase.execute).toHaveBeenCalledTimes(2);
    });

    it('erro inesperado num item não impede processamento dos demais (Promise.allSettled)', async () => {
      const charges = [makeCharge('id-a'), makeCharge('id-b'), makeCharge('id-c')];
      const { chargeRepo, expireChargeUseCase } = makeMocks(charges);

      expireChargeUseCase.execute
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Falha de infraestrutura inesperada'))
        .mockResolvedValueOnce(undefined);

      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      // Promise.allSettled garante que o método resolve mesmo com falha parcial
      await expect(scheduler.expirarCobrancastVencidas()).resolves.toBeUndefined();
      expect(expireChargeUseCase.execute).toHaveBeenCalledTimes(3);
    });
  });

  describe('lote no limite (BATCH_LIMIT)', () => {
    it('processa sem erro quando o lote atinge exatamente 100 cobranças', async () => {
      const charges = Array.from({ length: BATCH_LIMIT }, (_, i) =>
        makeCharge(`charge-${i}`),
      );
      const { chargeRepo, expireChargeUseCase } = makeMocks(charges);
      const scheduler = new ChargeExpirationScheduler(chargeRepo, expireChargeUseCase);

      await expect(scheduler.expirarCobrancastVencidas()).resolves.toBeUndefined();
      expect(expireChargeUseCase.execute).toHaveBeenCalledTimes(BATCH_LIMIT);
    });
  });
});
