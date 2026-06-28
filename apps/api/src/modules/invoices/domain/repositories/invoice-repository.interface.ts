import type { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';

/**
 * Contrato do repositório de invoices.
 * O domínio depende apenas desta interface — nunca de Mongoose ou qualquer ORM.
 */
export interface IInvoiceRepository {
  /** Persiste uma nova invoice na coleção */
  create(invoice: Invoice): Promise<void>;
  /** Atualiza os campos mutáveis de uma invoice existente */
  save(invoice: Invoice): Promise<void>;
  /** Busca invoice pelo seu identificador único */
  findById(id: string): Promise<Invoice | null>;
  /** Busca invoice pelo ID do pagamento associado (relação 1-para-1) */
  findByPaymentId(paymentId: string): Promise<Invoice | null>;
}
