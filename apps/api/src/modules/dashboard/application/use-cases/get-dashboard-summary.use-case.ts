import { Inject, Injectable } from '@nestjs/common';
import type { IChargeRepository } from '@/modules/charges/domain/repositories/charge-repository.interface';
import type { IPaymentRepository } from '@/modules/payments/domain/repositories/payment-repository.interface';
import type { IInvoiceRepository } from '@/modules/invoices/domain/repositories/invoice-repository.interface';
import { CHARGE_REPOSITORY } from '@/modules/charges/charges.tokens';
import { PAYMENT_REPOSITORY } from '@/modules/payments/payments.tokens';
import { INVOICE_REPOSITORY } from '@/modules/invoices/invoices.tokens';

/** Dados de contagem de cobranças por status */
export interface ChargesSummaryData {
  total: number;
  pending: number;
  awaitingPayment: number;
  paid: number;
  canceled: number;
  expired: number;
  failed: number;
}

/** Dados de contagem de pagamentos por status */
export interface PaymentsSummaryData {
  total: number;
  pending: number;
  processing: number;
  approved: number;
  failed: number;
  expired: number;
}

/** Dados de contagem de notas fiscais por status */
export interface InvoicesSummaryData {
  total: number;
  requested: number;
  processing: number;
  issued: number;
  failed: number;
}

/** Shape de retorno do caso de uso — read model sem acoplamento à apresentação */
export interface DashboardSummaryData {
  charges: ChargesSummaryData;
  payments: PaymentsSummaryData;
  invoices: InvoicesSummaryData;
  /** Taxa de aprovação em percentual (0–100) */
  approvalRate: number;
}

/**
 * Caso de uso de leitura: agrega contagens por status de charges, payments e invoices.
 * Injeção cruzada legítima do lado CQRS-read — sem mutar estado de domínio.
 */
@Injectable()
export class GetDashboardSummaryUseCase {
  constructor(
    @Inject(CHARGE_REPOSITORY) private readonly chargeRepo: IChargeRepository,
    @Inject(PAYMENT_REPOSITORY) private readonly paymentRepo: IPaymentRepository,
    @Inject(INVOICE_REPOSITORY) private readonly invoiceRepo: IInvoiceRepository,
  ) {}

  async execute(): Promise<DashboardSummaryData> {
    const [chargesByStatus, paymentsByStatus, invoicesByStatus] = await Promise.all([
      this.chargeRepo.countByStatus(),
      this.paymentRepo.countByStatus(),
      this.invoiceRepo.countByStatus(),
    ]);

    return {
      charges: this.buildChargesSummary(chargesByStatus),
      payments: this.buildPaymentsSummary(paymentsByStatus),
      invoices: this.buildInvoicesSummary(invoicesByStatus),
      approvalRate: this.calcApprovalRate(paymentsByStatus),
    };
  }

  private buildChargesSummary(byStatus: Record<string, number>): ChargesSummaryData {
    const pending = byStatus['pending'] ?? 0;
    const awaitingPayment = byStatus['awaiting_payment'] ?? 0;
    const paid = byStatus['paid'] ?? 0;
    const canceled = byStatus['canceled'] ?? 0;
    const expired = byStatus['expired'] ?? 0;
    const failed = byStatus['failed'] ?? 0;
    const total = pending + awaitingPayment + paid + canceled + expired + failed;
    return { total, pending, awaitingPayment, paid, canceled, expired, failed };
  }

  private buildPaymentsSummary(byStatus: Record<string, number>): PaymentsSummaryData {
    const pending = byStatus['pending'] ?? 0;
    const processing = byStatus['processing'] ?? 0;
    const approved = byStatus['approved'] ?? 0;
    const failed = byStatus['failed'] ?? 0;
    const expired = byStatus['expired'] ?? 0;
    const total = pending + processing + approved + failed + expired;
    return { total, pending, processing, approved, failed, expired };
  }

  private buildInvoicesSummary(byStatus: Record<string, number>): InvoicesSummaryData {
    const requested = byStatus['requested'] ?? 0;
    const processing = byStatus['processing'] ?? 0;
    const issued = byStatus['issued'] ?? 0;
    const failed = byStatus['failed'] ?? 0;
    const total = requested + processing + issued + failed;
    return { total, requested, processing, issued, failed };
  }

  /**
   * Taxa de aprovação = approved / finalizados × 100.
   * Finalizados = approved + failed + expired (pagamentos que saíram do fluxo ativo).
   * Retorna 0 quando não há pagamentos finalizados para evitar divisão por zero.
   */
  private calcApprovalRate(byStatus: Record<string, number>): number {
    const approved = byStatus['approved'] ?? 0;
    const finalized = approved + (byStatus['failed'] ?? 0) + (byStatus['expired'] ?? 0);
    if (finalized === 0) return 0;
    return (approved / finalized) * 100;
  }
}
