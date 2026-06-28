import type { Payment } from '@/modules/payments/domain/entities/payment.entity';

/**
 * Porta do repositório de Payments.
 * O domínio depende desta interface; a infraestrutura provê a implementação.
 */
export interface IPaymentRepository {
  create(payment: Payment): Promise<void>;
  findById(id: string): Promise<Payment | null>;
  update(payment: Payment): Promise<void>;
  /** Retorna pagamentos vinculados a uma cobrança, paginados */
  findByChargeId(
    chargeId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Payment[]; total: number }>;
  /** Suporte a idempotência: busca por chave de idempotência */
  findByIdempotencyKey(key: string): Promise<Payment | null>;
  /**
   * Retorna o primeiro pagamento ativo (pending ou processing) vinculado a uma cobrança.
   * Usado pelo consumer de charge.expired.v1 para expirar pagamentos presos.
   * Retorna null se não houver pagamento ativo para a cobrança.
   */
  findActiveByChargeId(chargeId: string): Promise<Payment | null>;
  /**
   * Retorna mapa de status → quantidade para uso no dashboard agregado.
   * Somente statuses com documentos existentes aparecem no mapa retornado.
   */
  countByStatus(): Promise<Record<string, number>>;
}
