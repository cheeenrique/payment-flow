import { ChargeExpiredConsumer } from './charge-expired.consumer';
import { Payment } from '@/modules/payments/domain/entities/payment.entity';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';
import type { SseService } from '@/infra/sse/sse.service';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

const basePaymentProps = {
  chargeId: 'charge-uuid',
  customerId: 'customer-uuid',
  amount: 5000,
  method: 'pix' as const,
};

function criarPagamentoPending(): Payment {
  return Payment.create(basePaymentProps);
}

function criarPagamentoProcessing(): Payment {
  return Payment.create(basePaymentProps).startProcessing();
}

function criarPagamentoAprovado(): Payment {
  return Payment.create(basePaymentProps).startProcessing().approve();
}

function criarPagamentoFalho(): Payment {
  return Payment.create(basePaymentProps).startProcessing().fail('saldo insuficiente');
}

function criarEventoFake(
  chargeId = 'charge-uuid',
  correlationId = 'correlation-uuid',
): IntegrationEvent {
  return {
    id: 'event-uuid',
    type: 'charge.expired.v1',
    aggregateId: chargeId,
    correlationId,
    timestamp: new Date(),
    payload: { customerId: 'customer-uuid' },
  };
}

function criarMocks(paymentFake: Payment | null = null) {
  const repo: jest.Mocked<IPaymentRepository> = {
    create: jest.fn(),
    findById: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    findByChargeId: jest.fn(),
    findByIdempotencyKey: jest.fn(),
    findActiveByChargeId: jest.fn().mockResolvedValue(paymentFake),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  const sseService = {
    emit: jest.fn(),
    stream: jest.fn(),
  } as unknown as jest.Mocked<SseService>;

  return { repo, eventBus, sseService };
}

describe('ChargeExpiredConsumer', () => {
  describe('sem pagamento ativo para a cobrança', () => {
    it('resolve sem erro quando findActiveByChargeId retorna null', async () => {
      const { repo, eventBus, sseService } = criarMocks(null);
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await expect(consumer.handleChargeExpired(criarEventoFake())).resolves.toBeUndefined();
    });

    it('não persiste, não publica e não emite SSE quando pagamento não existe', async () => {
      const { repo, eventBus, sseService } = criarMocks(null);
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(repo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
      expect(sseService.emit).not.toHaveBeenCalled();
    });
  });

  describe('pagamento já em estado terminal — idempotência', () => {
    it('não expira pagamento aprovado — retorna sem persistir', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoAprovado());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(repo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });

    it('não expira pagamento falho — retorna sem persistir', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoFalho());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(repo.update).not.toHaveBeenCalled();
      expect(eventBus.publish).not.toHaveBeenCalled();
    });
  });

  describe('expiração do pagamento ativo', () => {
    it('expira e persiste pagamento em pending', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoPending());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(repo.update).toHaveBeenCalledTimes(1);
      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'expired' }),
      );
    });

    it('expira e persiste pagamento em processing', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoProcessing());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(repo.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'expired' }),
      );
    });

    it('publica evento payment.expired.v1 no eventBus', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoPending());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(eventBus.publish).toHaveBeenCalledTimes(1);
      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'payment.expired.v1' }),
      );
    });

    it('emite evento SSE com tipo payment.expired', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoPending());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake());

      expect(sseService.emit).toHaveBeenCalledTimes(1);
      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'payment.expired' }),
      );
    });

    it('SSE carrega chargeId, paymentId e status expired no payload', async () => {
      const payment = criarPagamentoPending();
      const { repo, eventBus, sseService } = criarMocks(payment);
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await consumer.handleChargeExpired(criarEventoFake('charge-uuid'));

      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'payment.expired',
          data: expect.objectContaining({
            chargeId: 'charge-uuid',
            status: 'expired',
          }),
        }),
      );
    });

    it('propaga o correlationId recebido para o evento publicado', async () => {
      const { repo, eventBus, sseService } = criarMocks(criarPagamentoPending());
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);
      const correlationId = 'meu-correlation-id';

      await consumer.handleChargeExpired(criarEventoFake('charge-uuid', correlationId));

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ correlationId }),
      );
    });
  });

  describe('resiliência — erro interno não relançado', () => {
    it('não relança erro quando findActiveByChargeId falha', async () => {
      const { repo, eventBus, sseService } = criarMocks();
      repo.findActiveByChargeId.mockRejectedValue(new Error('Falha de banco'));
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await expect(consumer.handleChargeExpired(criarEventoFake())).resolves.toBeUndefined();
    });

    it('não relança erro quando repo.update falha', async () => {
      const payment = criarPagamentoPending();
      const { repo, eventBus, sseService } = criarMocks(payment);
      repo.update.mockRejectedValue(new Error('Falha de persistência'));
      const consumer = new ChargeExpiredConsumer(repo, eventBus, sseService);

      await expect(consumer.handleChargeExpired(criarEventoFake())).resolves.toBeUndefined();
    });
  });
});
