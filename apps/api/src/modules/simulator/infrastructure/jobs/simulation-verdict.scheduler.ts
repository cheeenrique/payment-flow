import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SCHEDULED_VERDICT_REPOSITORY } from '@/modules/simulator/simulator.tokens';
import type { IScheduledVerdictRepository } from '@/modules/simulator/domain/repositories/scheduled-verdict-repository.interface';
import type { ScheduledVerdict } from '@/modules/simulator/domain/entities/scheduled-verdict.entity';
import { SimulatorPaymentApprovedEvent } from '@/modules/simulator/domain/events/simulator-payment-approved.event';
import {
  SimulatorPaymentFailedEvent,
  type SimulatorFailureReason,
} from '@/modules/simulator/domain/events/simulator-payment-failed.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';

/**
 * Scheduler durável de vereditos de simulação.
 *
 * Substituição do setTimeout em memória: roda a cada 10 segundos e processa
 * vereditos persistidos no Mongo com dueAt <= agora.
 *
 * Idempotência:
 *  - O use case que agenda vereditos só persiste se ainda não existe para o paymentId.
 *  - O scheduler marca status='processed' após emitir — veredito processado
 *    nunca é re-emitido mesmo em caso de reprocessamento da query.
 *  - Se o processo reiniciar após emitir mas antes de marcar, o veredito
 *    será re-emitido na próxima passada (at-least-once; downstream deve ser idempotente).
 *
 * Tamanho do lote: 100 por execução. Aviso emitido se lote estiver cheio.
 */
@Injectable()
export class SimulationVerdictScheduler {
  private readonly logger = new Logger(SimulationVerdictScheduler.name);

  /** Tamanho máximo do lote por execução — evita varredura irrestrita */
  private static readonly BATCH_LIMIT = 100;

  constructor(
    @Inject(SCHEDULED_VERDICT_REPOSITORY)
    private readonly verdictRepo: IScheduledVerdictRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processarVereditosPendentes(): Promise<void> {
    const now = new Date();
    const verdicts = await this.verdictRepo.findDue(now, SimulationVerdictScheduler.BATCH_LIMIT);

    if (verdicts.length === 0) return;

    if (verdicts.length === SimulationVerdictScheduler.BATCH_LIMIT) {
      this.logger.warn(
        `Lote de vereditos truncado em ${SimulationVerdictScheduler.BATCH_LIMIT} ` +
          `— possível acúmulo, verificar intervalo do cron`,
      );
    }

    this.logger.log(`Processando ${verdicts.length} veredito(s) pendente(s)`);

    // Promise.allSettled garante que uma falha individual não interrompe o lote
    const resultados = await Promise.allSettled(
      verdicts.map((verdict) => this.processarUm(verdict)),
    );

    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    if (falhas > 0) {
      this.logger.error(`${falhas} veredito(s) falharam neste lote`);
    }
  }

  /** Emite o veredito e marca como processado — permanece pending se a emissão falhar */
  private async processarUm(verdict: ScheduledVerdict): Promise<void> {
    try {
      this.emitirVeredito(verdict);
      await this.verdictRepo.markProcessed(verdict.id);
      this.logger.log(
        `Veredito processado: paymentId=${verdict.paymentId} outcome=${verdict.outcome}`,
      );
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao processar veredito: paymentId=${verdict.paymentId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Relança para que Promise.allSettled contabilize como rejected
      throw err;
    }
  }

  /** Publica eventos de integração e SSE conforme o outcome do veredito */
  private emitirVeredito(verdict: ScheduledVerdict): void {
    if (verdict.outcome === 'approved') {
      this.eventBus.publish(
        new SimulatorPaymentApprovedEvent(
          verdict.paymentId,
          verdict.correlationId,
          verdict.paymentMethod,
        ),
      );
      this.sseService.emit({
        type: 'simulator.payment.approved',
        data: { paymentId: verdict.paymentId, paymentMethod: verdict.paymentMethod },
      });
      return;
    }

    const reason: SimulatorFailureReason = verdict.failureReason ?? 'card_declined';
    this.eventBus.publish(
      new SimulatorPaymentFailedEvent(
        verdict.paymentId,
        verdict.correlationId,
        verdict.paymentMethod,
        reason,
      ),
    );
    this.sseService.emit({
      type: 'simulator.payment.failed',
      data: { paymentId: verdict.paymentId, paymentMethod: verdict.paymentMethod, reason },
    });
  }
}
