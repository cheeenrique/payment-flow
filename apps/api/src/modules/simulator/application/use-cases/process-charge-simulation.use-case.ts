import { Inject, Injectable, Logger } from '@nestjs/common';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import { PaymentDelayEvent } from '@/modules/simulator/domain/events/payment-delay.event';
import { PaymentForceSuccessEvent } from '@/modules/simulator/domain/events/payment-force-success.event';
import { PaymentForceFailureEvent } from '@/modules/simulator/domain/events/payment-force-failure.event';
import type { FailureReason } from '@/modules/simulator/domain/events/payment-force-failure.event';
import { ChargeExpiredEvent } from '@/modules/simulator/domain/events/charge-expired.event';
import { InjectErrorEvent } from '@/modules/simulator/domain/events/inject-error.event';
import { SIMULATOR_CONFIG_REPOSITORY } from '@/modules/simulator/simulator.tokens';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';

/** Método de pagamento suportado pelo simulador */
export type PaymentMethod = 'pix' | 'boleto' | 'credit_card';

export interface ProcessChargeSimulationInput {
  chargeId: string;
  paymentMethod: PaymentMethod;
  correlationId: string;
}

/** Resultado interno do cálculo de simulação — decide o que será publicado após o delay */
interface SimulationOutcome {
  delayMs: number;
  approved: boolean;
  expired: boolean;
  systemError: boolean;
  failureReason?: FailureReason;
}

/**
 * Caso de uso central do simulador: executa a lógica de PSP artificial.
 *
 * Fluxo:
 *  1. Carrega configuração atual
 *  2. Calcula delay e resultado com base no método de pagamento
 *  3. Publica evento de delay imediatamente (para SSE)
 *  4. Agenda resolução assíncrona via setTimeout (não bloqueia — suporta delay de boleto de 5 min)
 */
@Injectable()
export class ProcessChargeSimulationUseCase {
  private readonly logger = new Logger(ProcessChargeSimulationUseCase.name);

  constructor(
    @Inject(SIMULATOR_CONFIG_REPOSITORY)
    private readonly repo: ISimulatorConfigRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(input: ProcessChargeSimulationInput): Promise<void> {
    const config = await this.repo.findGlobal() ?? SimulatorConfig.createDefault();
    const outcome = this.computeOutcome(config, input.paymentMethod);

    this.notifyDelay(input, outcome);

    // Resolução não-bloqueante — permite delays longos sem travar o thread principal
    setTimeout(() => this.resolve(input, outcome), outcome.delayMs);
  }

  // ─── Cálculo do resultado por método ────────────────────────────────────────

  private computeOutcome(config: SimulatorConfig, method: PaymentMethod): SimulationOutcome {
    if (method === 'pix') return this.computePixOutcome(config);
    if (method === 'boleto') return this.computeBoletoOutcome(config);
    return this.computeCreditCardOutcome(config);
  }

  private computePixOutcome(config: SimulatorConfig): SimulationOutcome {
    // PIX: delay aleatório entre 0 e maxDelayMs; falha = intermitência
    const delayMs = Math.floor(Math.random() * config.pix.maxDelayMs);
    const approved = Math.random() < config.pix.successRate;
    return {
      delayMs,
      approved,
      expired: false,
      systemError: false,
      failureReason: approved ? undefined : 'intermittent_failure',
    };
  }

  private computeBoletoOutcome(config: SimulatorConfig): SimulationOutcome {
    // Boleto não pago = cobrança expirada (prazo vencido sem compensação)
    const approved = Math.random() < config.boleto.successRate;
    return { delayMs: config.boleto.delayMs, approved, expired: !approved, systemError: false };
  }

  private computeCreditCardOutcome(config: SimulatorConfig): SimulationOutcome {
    // Cartão: 1 s fixo simulando latência da rede adquirente
    const delayMs = 1_000;
    if (Math.random() < config.creditCard.riskFactor) {
      // riskFactor dispara erro sistêmico (PSP indisponível, timeout, etc.)
      return { delayMs, approved: false, expired: false, systemError: true };
    }
    const approved = Math.random() < config.creditCard.successRate;
    return {
      delayMs,
      approved,
      expired: false,
      systemError: false,
      failureReason: approved ? undefined : 'insufficient_funds',
    };
  }

  // ─── Notificação imediata de delay ──────────────────────────────────────────

  private notifyDelay(input: ProcessChargeSimulationInput, outcome: SimulationOutcome): void {
    if (outcome.delayMs <= 0) return;

    this.eventBus.publish(
      new PaymentDelayEvent(input.chargeId, input.correlationId, input.paymentMethod, outcome.delayMs),
    );
    this.sseService.emit({
      type: 'simulator.payment.delay',
      data: { chargeId: input.chargeId, paymentMethod: input.paymentMethod, delayMs: outcome.delayMs },
    });
  }

  // ─── Resolução assíncrona após delay ────────────────────────────────────────

  private resolve(input: ProcessChargeSimulationInput, outcome: SimulationOutcome): void {
    try {
      if (outcome.systemError) return this.resolveAsSystemError(input);
      if (outcome.expired) return this.resolveAsExpired(input);
      if (outcome.approved) return this.resolveAsSuccess(input);
      this.resolveAsFailure(input, outcome.failureReason ?? 'card_declined');
    } catch (err) {
      this.logger.error(
        `Falha ao resolver simulação charge=${input.chargeId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private resolveAsSuccess(input: ProcessChargeSimulationInput): void {
    this.eventBus.publish(
      new PaymentForceSuccessEvent(input.chargeId, input.correlationId, input.paymentMethod),
    );
    this.sseService.emit({
      type: 'simulator.payment.force_success',
      data: { chargeId: input.chargeId, paymentMethod: input.paymentMethod },
    });
    this.logger.log(`Simulação aprovada: charge=${input.chargeId} method=${input.paymentMethod}`);
  }

  private resolveAsFailure(input: ProcessChargeSimulationInput, reason: FailureReason): void {
    this.eventBus.publish(
      new PaymentForceFailureEvent(input.chargeId, input.correlationId, input.paymentMethod, reason),
    );
    this.sseService.emit({
      type: 'simulator.payment.force_failure',
      data: { chargeId: input.chargeId, paymentMethod: input.paymentMethod, reason },
    });
    this.logger.log(`Simulação recusada: charge=${input.chargeId} reason=${reason}`);
  }

  private resolveAsExpired(input: ProcessChargeSimulationInput): void {
    this.eventBus.publish(
      new ChargeExpiredEvent(input.chargeId, input.correlationId, input.paymentMethod),
    );
    this.sseService.emit({
      type: 'simulator.charge.expired',
      data: { chargeId: input.chargeId, paymentMethod: input.paymentMethod },
    });
    this.logger.log(`Cobrança expirada pelo simulador: charge=${input.chargeId}`);
  }

  private resolveAsSystemError(input: ProcessChargeSimulationInput): void {
    this.eventBus.publish(
      new InjectErrorEvent(input.chargeId, input.correlationId, 'Falha sistêmica simulada pelo PSP adquirente'),
    );
    this.sseService.emit({
      type: 'simulator.inject_error',
      data: { chargeId: input.chargeId, paymentMethod: input.paymentMethod },
    });
    this.logger.warn(`Erro sistêmico injetado pelo simulador: charge=${input.chargeId}`);
  }
}
