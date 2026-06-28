import { Inject, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';
import type { IInvoiceRepository } from '@/modules/invoices/domain/repositories/invoice-repository.interface';
import { InvoiceProcessingEvent } from '@/modules/invoices/domain/events/invoice-processing.event';
import { InvoiceIssuedEvent } from '@/modules/invoices/domain/events/invoice-issued.event';
import { InvoiceFailedEvent } from '@/modules/invoices/domain/events/invoice-failed.event';
import { EventBusService } from '@/infra/messaging/event-bus.service';
import { SseService } from '@/infra/sse/sse.service';
import { INVOICE_REPOSITORY } from '@/modules/invoices/invoices.tokens';

/** Intervalo de delay da simulação fiscal em milissegundos */
const DELAY_MIN_MS = 2_000;
const DELAY_MAX_MS = 5_000;

/** Taxa de sucesso da emissão simulada (80% aprovação, 20% falha fiscal) */
const TAXA_SUCESSO = 0.8;

/**
 * Simula o processamento fiscal de uma invoice.
 * Executado de forma fire-and-forget: não bloqueia o consumer do RabbitMQ.
 */
@Injectable()
export class ProcessInvoiceUseCase {
  private readonly logger = new Logger(ProcessInvoiceUseCase.name);

  constructor(
    @Inject(INVOICE_REPOSITORY) private readonly repo: IInvoiceRepository,
    private readonly eventBus: EventBusService,
    private readonly sseService: SseService,
  ) {}

  async execute(invoiceId: string, correlationId: string): Promise<void> {
    const invoice = await this.repo.findById(invoiceId);

    if (!invoice) {
      this.logger.warn(`Invoice não encontrada para processamento: id=${invoiceId}`);
      return;
    }

    const processing = await this.iniciarProcessamento(invoice, correlationId);
    await this.simularDelay();
    await this.finalizarProcessamento(processing, correlationId);
  }

  /** Marca a invoice como 'processing', persiste e notifica */
  private async iniciarProcessamento(invoice: Invoice, correlationId: string): Promise<Invoice> {
    const processing = invoice.markProcessing();
    await this.repo.save(processing);

    this.eventBus.publish(
      new InvoiceProcessingEvent(invoice.id, correlationId, invoice.paymentId),
    );
    this.sseService.emit({
      type: 'invoice.processing',
      data: { invoiceId: invoice.id, paymentId: invoice.paymentId, status: 'processing' },
    });

    return processing;
  }

  /** Decide o resultado da simulação e persiste o estado final */
  private async finalizarProcessamento(processing: Invoice, correlationId: string): Promise<void> {
    if (Math.random() < TAXA_SUCESSO) {
      await this.registrarSucesso(processing, correlationId);
    } else {
      await this.registrarFalha(processing, correlationId);
    }
  }

  private async registrarSucesso(processing: Invoice, correlationId: string): Promise<void> {
    const referencia = `NF-${randomUUID().slice(0, 8).toUpperCase()}`;
    const issued = processing.markIssued(referencia);
    const issuedAt = issued.issuedAt ?? new Date();

    await this.repo.save(issued);

    this.eventBus.publish(
      new InvoiceIssuedEvent(issued.id, correlationId, issued.paymentId, referencia, issuedAt),
    );
    this.sseService.emit({
      type: 'invoice.issued',
      data: {
        invoiceId: issued.id,
        paymentId: issued.paymentId,
        status: 'issued',
        externalReference: referencia,
        issuedAt,
      },
    });

    this.logger.log(`Invoice emitida com sucesso: id=${issued.id} ref=${referencia}`);
  }

  private async registrarFalha(processing: Invoice, correlationId: string): Promise<void> {
    const failed = processing.markFailed();
    await this.repo.save(failed);

    this.eventBus.publish(
      new InvoiceFailedEvent(failed.id, correlationId, failed.paymentId),
    );
    this.sseService.emit({
      type: 'invoice.failed',
      data: { invoiceId: failed.id, paymentId: failed.paymentId, status: 'failed' },
    });

    this.logger.warn(`Falha simulada na emissão da invoice: id=${failed.id}`);
  }

  /** Simula o tempo de processamento junto ao órgão fiscal */
  private simularDelay(): Promise<void> {
    const delay =
      Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS + 1)) + DELAY_MIN_MS;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }
}
