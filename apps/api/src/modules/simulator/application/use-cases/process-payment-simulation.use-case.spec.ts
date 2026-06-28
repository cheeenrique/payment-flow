import { ProcessPaymentSimulationUseCase, ProcessPaymentSimulationInput } from './process-payment-simulation.use-case';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import type { IScheduledVerdictRepository } from '@/modules/simulator/domain/repositories/scheduled-verdict-repository.interface';
import type { EventBusService } from '@/infra/messaging/event-bus.service';
import type { SseService } from '@/infra/sse/sse.service';

/** Config com taxa de aprovação 100% — garante resultado determinístico */
function criarConfigSempreAprova(): SimulatorConfig {
  return new SimulatorConfig({
    id: SimulatorConfig.GLOBAL_ID,
    pix: { successRate: 1.0, maxDelayMs: 0 },
    boleto: { delayMs: 0, successRate: 1.0 },
    creditCard: { successRate: 1.0, riskFactor: 0.0 },
    updatedAt: new Date(),
  });
}

/** Config com taxa de aprovação 0% — garante falha determinística */
function criarConfigSempreFalha(): SimulatorConfig {
  return new SimulatorConfig({
    id: SimulatorConfig.GLOBAL_ID,
    pix: { successRate: 0.0, maxDelayMs: 0 },
    boleto: { delayMs: 0, successRate: 0.0 },
    creditCard: { successRate: 0.0, riskFactor: 0.0 },
    updatedAt: new Date(),
  });
}

/** Config com riskFactor 100% — garante erro sistêmico no cartão */
function criarConfigErroSistemico(): SimulatorConfig {
  return new SimulatorConfig({
    id: SimulatorConfig.GLOBAL_ID,
    pix: { successRate: 0.5, maxDelayMs: 0 },
    boleto: { delayMs: 0, successRate: 0.5 },
    creditCard: { successRate: 0.9, riskFactor: 1.0 },
    updatedAt: new Date(),
  });
}

function criarMocks(config: SimulatorConfig | null = criarConfigSempreAprova()) {
  const repo: jest.Mocked<ISimulatorConfigRepository> = {
    findGlobal: jest.fn().mockResolvedValue(config),
    upsert: jest.fn(),
  };

  // Repo de vereditos agendados: idempotência retorna false (nenhum agendado ainda).
  const verdictRepo: jest.Mocked<IScheduledVerdictRepository> = {
    save: jest.fn(),
    findDue: jest.fn().mockResolvedValue([]),
    markProcessed: jest.fn(),
    existsByPaymentId: jest.fn().mockResolvedValue(false),
  };

  const eventBus = {
    publish: jest.fn(),
    republish: jest.fn(),
  } as unknown as jest.Mocked<EventBusService>;

  const sseService = {
    emit: jest.fn(),
    stream: jest.fn(),
  } as unknown as jest.Mocked<SseService>;

  return { repo, verdictRepo, eventBus, sseService };
}

const inputPix: ProcessPaymentSimulationInput = {
  paymentId: 'payment-pix-uuid',
  method: 'pix',
  correlationId: 'corr-1',
};

const inputBoleto: ProcessPaymentSimulationInput = {
  paymentId: 'payment-boleto-uuid',
  method: 'boleto',
  correlationId: 'corr-2',
};

const inputCartao: ProcessPaymentSimulationInput = {
  paymentId: 'payment-card-uuid',
  method: 'credit_card',
  correlationId: 'corr-3',
};

describe('ProcessPaymentSimulationUseCase', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Controla Math.random para garantir determinismo:
    // 0.5 é menor que successRate=1.0 → aprovação; maior que successRate=0.0 → falha
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('uso da configuração do repositório', () => {
    it('usa a configuração do repositório quando disponível', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreAprova());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputPix);

      expect(repo.findGlobal).toHaveBeenCalledTimes(1);
    });

    it('usa configuração padrão quando repositório retorna null', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(null);
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      // Não deve lançar exceção — usa SimulatorConfig.createDefault()
      await expect(useCase.execute(inputPix)).resolves.toBeUndefined();
    });
  });

  describe('PIX — aprovação (successRate=1.0, Math.random=0.5)', () => {
    it('após o delay, publica SimulatorPaymentApproved via eventBus', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreAprova());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputPix);
      jest.runAllTimers();

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'simulator.payment.approved.v1' }),
      );
    });

    it('após o delay, emite evento SSE simulator.payment.approved', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreAprova());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputPix);
      jest.runAllTimers();

      expect(sseService.emit).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'simulator.payment.approved' }),
      );
    });
  });

  describe('PIX — falha (successRate=0.0, Math.random=0.5)', () => {
    it('após o delay, publica SimulatorPaymentFailed via eventBus', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreFalha());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputPix);
      jest.runAllTimers();

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'simulator.payment.failed.v1' }),
      );
    });

    it('falha PIX usa razão intermittent_failure', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreFalha());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputPix);
      jest.runAllTimers();

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ reason: 'intermittent_failure' }) }),
      );
    });
  });

  describe('Boleto — aprovação (successRate=1.0)', () => {
    it('após o delay, publica SimulatorPaymentApproved via eventBus', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreAprova());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputBoleto);
      jest.runAllTimers();

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'simulator.payment.approved.v1' }),
      );
    });
  });

  describe('Boleto — não pago (successRate=0.0)', () => {
    it('boleto não pago usa razão expired', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreFalha());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputBoleto);
      jest.runAllTimers();

      expect(eventBus.publish).toHaveBeenCalledWith(
        expect.objectContaining({ payload: expect.objectContaining({ reason: 'expired' }) }),
      );
    });
  });

  describe('Cartão — erro sistêmico (riskFactor=1.0)', () => {
    it('erro sistêmico publica SimulatorPaymentFailed com razão system_error', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigErroSistemico());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputCartao);

      // Cartão tem delay fixo de 1s (>0) → veredito é PERSISTIDO (durável), não emitido inline.
      expect(verdictRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'failed', failureReason: 'system_error' }),
      );
    });
  });

  describe('Cartão — aprovação (riskFactor=0.0, successRate=1.0)', () => {
    it('após o delay, publica aprovação para cartão com risco zero', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(criarConfigSempreAprova());
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputCartao);

      // Cartão (delay fixo 1s) → veredito persistido como 'approved'.
      expect(verdictRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'approved' }),
      );
    });
  });

  describe('Cartão — fundos insuficientes (riskFactor=0.0, successRate=0.0)', () => {
    it('falha de cartão sem risco sistêmico usa razão insufficient_funds', async () => {
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(
        new SimulatorConfig({
          id: SimulatorConfig.GLOBAL_ID,
          pix: { successRate: 0.5, maxDelayMs: 0 },
          boleto: { delayMs: 0, successRate: 0.5 },
          creditCard: { successRate: 0.0, riskFactor: 0.0 },
          updatedAt: new Date(),
        }),
      );
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputCartao);

      // Cartão (delay fixo 1s) → veredito persistido com razão insufficient_funds.
      expect(verdictRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ outcome: 'failed', failureReason: 'insufficient_funds' }),
      );
    });
  });

  describe('delay e notificações imediatas', () => {
    it('não notifica delay quando maxDelayMs=0 (delay zero)', async () => {
      const configSemDelay = criarConfigSempreAprova(); // maxDelayMs=0
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(configSemDelay);
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      await useCase.execute(inputPix);

      // Sem delay → notifyDelay não é chamado (delayMs <= 0)
      expect(eventBus.publish).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'simulator.payment.delay.v1' }),
      );
    });

    it('o execute retorna imediatamente (não bloqueia pelo delay)', async () => {
      const configComDelay = new SimulatorConfig({
        id: SimulatorConfig.GLOBAL_ID,
        pix: { successRate: 1.0, maxDelayMs: 5_000 },
        boleto: { delayMs: 10_000, successRate: 1.0 },
        creditCard: { successRate: 1.0, riskFactor: 0.0 },
        updatedAt: new Date(),
      });
      const { repo, verdictRepo, eventBus, sseService } = criarMocks(configComDelay);
      const useCase = new ProcessPaymentSimulationUseCase(repo, verdictRepo, eventBus, sseService);

      // Deve resolver sem aguardar o setTimeout (fake timers não avançam automaticamente)
      const promise = useCase.execute(inputBoleto);
      await expect(promise).resolves.toBeUndefined();
    });
  });
});
