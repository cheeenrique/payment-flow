// Porta de persistência para vereditos agendados pelo simulador.
// O domínio depende desta interface; a infra a implementa (DIP).
import type { ScheduledVerdict } from '@/modules/simulator/domain/entities/scheduled-verdict.entity';

export interface IScheduledVerdictRepository {
  /** Persiste um veredito pendente */
  save(verdict: ScheduledVerdict): Promise<void>;

  /**
   * Retorna vereditos com status='pending' e dueAt <= now.
   * Limitado a `limit` registros por chamada — evita varredura irrestrita.
   */
  findDue(now: Date, limit: number): Promise<ScheduledVerdict[]>;

  /** Marca o veredito como processado — idempotente, ignora se já processado */
  markProcessed(id: string): Promise<void>;

  /**
   * Verifica se já existe um veredito (pending ou processed) para o paymentId.
   * Usado para garantir idempotência no agendamento: um pagamento → um veredito.
   */
  existsByPaymentId(paymentId: string): Promise<boolean>;
}
