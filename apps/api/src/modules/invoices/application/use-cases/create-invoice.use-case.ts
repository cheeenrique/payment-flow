import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConflictError } from '@/shared/errors/conflict.error';
import { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';
import type { IInvoiceRepository } from '@/modules/invoices/domain/repositories/invoice-repository.interface';
import { InvoiceRequestedEvent } from '@/modules/invoices/domain/events/invoice-requested.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { ProcessInvoiceUseCase } from './process-invoice.use-case';
import { INVOICE_REPOSITORY } from '@/modules/invoices/invoices.tokens';

export interface CreateInvoiceInput {
  paymentId: string;
  chargeId: string;
  customerId: string;
  amount: number;
  correlationId: string;
}

/**
 * Cria (ou reenfileira) uma invoice para o pagamento informado.
 * Garante idempotência: cada payment gera no máximo uma invoice.
 * Dispara o processamento fiscal de forma assíncrona (fire-and-forget).
 */
@Injectable()
export class CreateInvoiceUseCase {
  private readonly logger = new Logger(CreateInvoiceUseCase.name);

  constructor(
    @Inject(INVOICE_REPOSITORY) private readonly repo: IInvoiceRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
    private readonly processInvoice: ProcessInvoiceUseCase,
  ) {}

  async execute(input: CreateInvoiceInput): Promise<Invoice> {
    const existing = await this.repo.findByPaymentId(input.paymentId);

    if (existing) {
      return this.resolveExisting(existing, input);
    }

    return this.createAndProcess(input);
  }

  /** Trata invoice já existente para o mesmo paymentId */
  private async resolveExisting(invoice: Invoice, input: CreateInvoiceInput): Promise<Invoice> {
    if (invoice.isIssued()) {
      throw new ConflictError('Invoice já emitida para este pagamento', undefined, {
        paymentId: input.paymentId,
        invoiceId: invoice.id,
      });
    }

    if (invoice.isInProgress()) {
      throw new ConflictError('Emissão de invoice já em andamento para este pagamento', undefined, {
        paymentId: input.paymentId,
        invoiceId: invoice.id,
        status: invoice.status,
      });
    }

    // Reprocessamento de invoice com falha — permitido via simulator
    const reset = invoice.resetToRequested();
    await this.repo.save(reset);
    this.publicarRequisicao(reset, input.correlationId);
    this.dispararProcessamento(reset.id, input.correlationId);
    return reset;
  }

  private async createAndProcess(input: CreateInvoiceInput): Promise<Invoice> {
    const invoice = Invoice.create({
      paymentId: input.paymentId,
      chargeId: input.chargeId,
      customerId: input.customerId,
      amount: input.amount,
    });

    await this.repo.create(invoice);
    this.publicarRequisicao(invoice, input.correlationId);
    this.dispararProcessamento(invoice.id, input.correlationId);
    return invoice;
  }

  private publicarRequisicao(invoice: Invoice, correlationId: string): void {
    this.eventBus.publish(
      new InvoiceRequestedEvent(
        invoice.id,
        correlationId,
        invoice.paymentId,
        invoice.chargeId,
        invoice.customerId,
        invoice.amount,
      ),
    );

    this.sseService.emit({
      type: 'invoice.requested',
      data: { invoiceId: invoice.id, paymentId: invoice.paymentId, status: 'requested' },
    });
  }

  /** Inicia processamento fiscal de forma assíncrona — não bloqueia o caller */
  private dispararProcessamento(invoiceId: string, correlationId: string): void {
    this.processInvoice.execute(invoiceId, correlationId).catch((err: unknown) => {
      this.logger.error(
        `Falha no processamento da invoice ${invoiceId}`,
        err instanceof Error ? err.stack : String(err),
      );
    });
  }
}
