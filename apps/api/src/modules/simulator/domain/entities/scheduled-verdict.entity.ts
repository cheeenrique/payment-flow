import { randomUUID } from 'node:crypto';
import type { SimulatorFailureReason } from '@/modules/simulator/domain/events/simulator-payment-failed.event';

/** Resultado do veredito agendado */
export type VerdictOutcome = 'approved' | 'failed';

/** Ciclo de vida do veredito persistido */
export type VerdictStatus = 'pending' | 'processed';

export interface ScheduledVerdictProps {
  id: string;
  paymentId: string;
  correlationId: string;
  paymentMethod: string;
  outcome: VerdictOutcome;
  failureReason?: SimulatorFailureReason;
  /** Momento a partir do qual o veredito pode ser emitido */
  dueAt: Date;
  status: VerdictStatus;
  createdAt: Date;
}

/**
 * Entidade de domínio que representa um veredito de simulação agendado.
 *
 * Substitui o setTimeout em memória — ao persistir o veredito no Mongo,
 * o resultado sobrevive a restarts/redeploys (disposability — 12-factor #9).
 *
 * Imutável: toda mudança de estado retorna nova instância.
 */
export class ScheduledVerdict {
  readonly id: string;
  readonly paymentId: string;
  readonly correlationId: string;
  readonly paymentMethod: string;
  readonly outcome: VerdictOutcome;
  readonly failureReason?: SimulatorFailureReason;
  readonly dueAt: Date;
  readonly status: VerdictStatus;
  readonly createdAt: Date;

  constructor(props: ScheduledVerdictProps) {
    this.id = props.id;
    this.paymentId = props.paymentId;
    this.correlationId = props.correlationId;
    this.paymentMethod = props.paymentMethod;
    this.outcome = props.outcome;
    this.failureReason = props.failureReason;
    this.dueAt = props.dueAt;
    this.status = props.status;
    this.createdAt = props.createdAt;
  }

  /**
   * Fábrica — cria novo veredito com status 'pending'.
   * O ID é gerado automaticamente; dueAt = agora + delayMs.
   */
  static schedule(
    paymentId: string,
    correlationId: string,
    paymentMethod: string,
    outcome: VerdictOutcome,
    delayMs: number,
    failureReason?: SimulatorFailureReason,
  ): ScheduledVerdict {
    const now = new Date();
    return new ScheduledVerdict({
      id: randomUUID(),
      paymentId,
      correlationId,
      paymentMethod,
      outcome,
      failureReason,
      dueAt: new Date(now.getTime() + delayMs),
      status: 'pending',
      createdAt: now,
    });
  }
}
