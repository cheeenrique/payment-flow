import { Inject, Injectable, Logger } from '@nestjs/common';
import { SimulatorConfig } from '@/modules/simulator/domain/entities/simulator-config.entity';
import { ScheduledVerdict } from '@/modules/simulator/domain/entities/scheduled-verdict.entity';
import type { ISimulatorConfigRepository } from '@/modules/simulator/domain/repositories/simulator-config-repository.interface';
import type { IScheduledVerdictRepository } from '@/modules/simulator/domain/repositories/scheduled-verdict-repository.interface';
import { SimulatorPaymentApprovedEvent } from '@/modules/simulator/domain/events/simulator-payment-approved.event';
import {
  SimulatorPaymentFailedEvent,
  type SimulatorFailureReason,
} from '@/modules/simulator/domain/events/simulator-payment-failed.event';
import { PaymentDelayEvent } from '@/modules/simulator/domain/events/payment-delay.event';
import { SIMULATOR_CONFIG_REPOSITORY, SCHEDULED_VERDICT_REPOSITORY } from '@/modules/simulator/simulator.tokens';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';

/** Método de pagamento suportado pelo simulador */
export type SimulatorPaymentMethod = 'pix' | 'boleto' | 'credit_card';

export interface ProcessPaymentSimulationInput {
  /** ID do pagamento a ser simulado */
  paymentId: string;
  method: SimulatorPaymentMethod;
  correlationId: string;
}

/** Resultado interno — decide o que será publicado após o delay */
interface SimulationOutcome {
  delayMs: number;
  approved: boolean;
  expired: boolean;
  systemError: boolean;
  failureReason?: SimulatorFailureReason;
}

/**
 * Caso de uso do simulador centrado em pagamentos (MODELO A).
 *
 * Recebe o paymentId (não mais chargeId) e emite vereditos que o módulo Payments
 * sabe consumir. Isola toda a lógica de PSP artificial em um único lugar.
 *
 * Fluxo (durável — disposability 12-factor #9):
 *  1. Carrega a configuração ativa do simulador
 *  2. Calcula delay e resultado por método de pagamento
 *  3. Notifica delay imediatamente via SSE e RabbitMQ
 *  4a. delay == 0: emite o veredito imediatamente (inline)
 *  4b. delay > 0: persiste veredito no Mongo; cron (SimulationVerdictScheduler)
 *      processa quando dueAt <= now — sobrevive a restarts/redeploys
 *
 * Idempotência: se payment.processing.v1 for reprocessado para o mesmo paymentId,
 * a verificação de existência impede criação de veredito duplicado.
 */
@Injectable()
export class ProcessPaymentSimulationUseCase {
  private readonly logger = new Logger(ProcessPaymentSimulationUseCase.name);

  constructor(
    @Inject(SIMULATOR_CONFIG_REPOSITORY)
    private readonly configRepo: ISimulatorConfigRepository,
    @Inject(SCHEDULED_VERDICT_REPOSITORY)
    private readonly verdictRepo: IScheduledVerdictRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(input: ProcessPaymentSimulationInput): Promise<void> {
    const config = await this.configRepo.findGlobal() ?? SimulatorConfig.createDefault();
    const outcome = this.computeOutcome(config, input.method);

    this.notifyDelay(input, outcome);

    if (outcome.delayMs <= 0) {
      // Resolução instantânea — sem delay, emite inline
      this.resolveImediato(input, outcome);
      return;
    }

    // Resolução durável — persiste no Mongo; cron emite quando dueAt <= now
    await this.scheduleVerdict(input, outcome);
  }

  // ─── Cálculo do resultado por método ────────────────────────────────────────

  private computeOutcome(config: SimulatorConfig, method: SimulatorPaymentMethod): SimulationOutcome {
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
    // Boleto não pago dentro do prazo = expirado (prazo vencido sem compensação)
    const approved = Math.random() < config.boleto.successRate;
    return {
      delayMs: config.boleto.delayMs,
      approved,
      expired: !approved,
      systemError: false,
      failureReason: approved ? undefined : 'expired',
    };
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

  private notifyDelay(input: ProcessPaymentSimulationInput, outcome: SimulationOutcome): void {
    if (outcome.delayMs <= 0) return;

    this.eventBus.publish(
      new PaymentDelayEvent(input.paymentId, input.correlationId, input.method, outcome.delayMs),
    );
    this.sseService.emit({
      type: 'simulator.payment.delay',
      data: { paymentId: input.paymentId, paymentMethod: input.method, delayMs: outcome.delayMs },
    });
  }

  // ─── Resolução imediata (delay == 0) ────────────────────────────────────────

  private resolveImediato(input: ProcessPaymentSimulationInput, outcome: SimulationOutcome): void {
    try {
      if (outcome.systemError) return this.resolveAsSystemError(input);
      if (outcome.expired) return this.resolveAsExpired(input);
      if (outcome.approved) return this.resolveAsApproved(input);
      this.resolveAsFailure(input, outcome.failureReason ?? 'card_declined');
    } catch (err) {
      this.logger.error(
        `Falha ao resolver simulação imediata paymentId=${input.paymentId}`,
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private resolveAsApproved(input: ProcessPaymentSimulationInput): void {
    this.eventBus.publish(
      new SimulatorPaymentApprovedEvent(input.paymentId, input.correlationId, input.method),
    );
    this.sseService.emit({
      type: 'simulator.payment.approved',
      data: { paymentId: input.paymentId, paymentMethod: input.method },
    });
    this.logger.log(`Simulação aprovada (inline): paymentId=${input.paymentId} method=${input.method}`);
  }

  private resolveAsFailure(input: ProcessPaymentSimulationInput, reason: SimulatorFailureReason): void {
    this.eventBus.publish(
      new SimulatorPaymentFailedEvent(input.paymentId, input.correlationId, input.method, reason),
    );
    this.sseService.emit({
      type: 'simulator.payment.failed',
      data: { paymentId: input.paymentId, paymentMethod: input.method, reason },
    });
    this.logger.log(`Simulação recusada (inline): paymentId=${input.paymentId} reason=${reason}`);
  }

  private resolveAsExpired(input: ProcessPaymentSimulationInput): void {
    // Boleto expirado é tratado como falha com razão 'expired'
    this.resolveAsFailure(input, 'expired');
    this.logger.log(`Pagamento expirado pelo simulador (inline): paymentId=${input.paymentId}`);
  }

  private resolveAsSystemError(input: ProcessPaymentSimulationInput): void {
    this.resolveAsFailure(input, 'system_error');
    this.logger.warn(`Erro sistêmico injetado pelo simulador (inline): paymentId=${input.paymentId}`);
  }

  // ─── Agendamento durável (delay > 0) ────────────────────────────────────────

  private async scheduleVerdict(
    input: ProcessPaymentSimulationInput,
    outcome: SimulationOutcome,
  ): Promise<void> {
    // Idempotência: evita duplicar veredito para reprocessamento do mesmo evento
    const jaAgendado = await this.verdictRepo.existsByPaymentId(input.paymentId);
    if (jaAgendado) {
      this.logger.warn(
        `Veredito já agendado para paymentId=${input.paymentId} — reprocessamento ignorado`,
      );
      return;
    }

    const verdictOutcome = outcome.approved ? 'approved' : 'failed';
    const failureReason = this.resolveFailureReason(outcome);
    const verdict = ScheduledVerdict.schedule(
      input.paymentId,
      input.correlationId,
      input.method,
      verdictOutcome,
      outcome.delayMs,
      failureReason,
    );

    await this.verdictRepo.save(verdict);
    this.logger.log(
      `Veredito agendado: paymentId=${input.paymentId} outcome=${verdictOutcome} ` +
        `dueAt=${verdict.dueAt.toISOString()}`,
    );
  }

  /**
   * Determina a razão de falha a persistir no veredito.
   * Garante que erros sistêmicos sem failureReason explícita usem 'system_error'.
   */
  private resolveFailureReason(outcome: SimulationOutcome): SimulatorFailureReason | undefined {
    if (outcome.approved) return undefined;
    if (outcome.systemError) return 'system_error';
    return outcome.failureReason ?? 'card_declined';
  }
}
