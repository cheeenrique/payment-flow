import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/not-found.error';
import type { IInvoiceRepository } from '@/modules/invoices/domain/repositories/invoice-repository.interface';
import { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';
import { INVOICE_REPOSITORY } from '@/modules/invoices/invoices.tokens';

/** Consulta a nota fiscal vinculada a um pagamento específico */
@Injectable()
export class FindInvoiceByPaymentUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY) private readonly repo: IInvoiceRepository,
  ) {}

  async execute(paymentId: string): Promise<Invoice> {
    const invoice = await this.repo.findByPaymentId(paymentId);

    if (!invoice) {
      throw new NotFoundError('Invoice não encontrada para este pagamento', undefined, {
        paymentId,
      });
    }

    return invoice;
  }
}
