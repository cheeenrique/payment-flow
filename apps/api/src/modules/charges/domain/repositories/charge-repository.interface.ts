import type { Charge } from '@/modules/charges/domain/entities/charge.entity';

/** Filtros aceitos na listagem de cobranças */
export interface ListChargesFilter {
  status?: string;
  customerId?: string;
}

/** Resultado paginado da listagem de cobranças */
export interface ListChargesResult {
  items: Charge[];
  total: number;
}

/**
 * Porta do repositório de cobranças.
 * O domínio depende apenas desta interface — a implementação Mongoose fica na infra.
 */
export interface IChargeRepository {
  create(charge: Charge): Promise<void>;
  findById(id: string): Promise<Charge | null>;
  /** Retorna lista paginada de cobranças com total para cálculo de hasNext/hasPrev */
  findAll(
    filter: ListChargesFilter | undefined,
    page: number,
    limit: number,
  ): Promise<ListChargesResult>;
  update(charge: Charge): Promise<void>;
  /**
   * Retorna cobranças ainda abertas (pending/awaiting_payment) cujo prazo já venceu.
   * Usado pelo scheduler de expiração — limite impede varredura total da collection.
   */
  findExpirable(now: Date, limit: number): Promise<Charge[]>;
  /**
   * Retorna mapa de status → quantidade para uso no dashboard agregado.
   * Somente statuses com documentos existentes aparecem no mapa retornado.
   */
  countByStatus(): Promise<Record<string, number>>;
  /** Localiza cobrança pelo token do link de pagamento. Retorna null quando não encontrada. */
  findByPaymentLinkToken(token: string): Promise<Charge | null>;
}
