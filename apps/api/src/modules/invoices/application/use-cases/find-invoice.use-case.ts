import { Inject, Injectable } from '@nestjs/common';
import { NotFoundError } from '@/shared/errors/not-found.error';
import type { IInvoiceRepository } from '@/modules/invoices/domain/repositories/invoice-repository.interface';
import { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';
import { INVOICE_REPOSITORY } from '@/modules/invoices/invoices.tokens';

/** Consulta uma nota fiscal pelo seu identificador único */
@Injectable()
export class FindInvoiceUseCase {
  constructor(
    @Inject(INVOICE_REPOSITORY) private readonly repo: IInvoiceRepository,
  ) {}

  async execute(id: string): Promise<Invoice> {
    const invoice = await this.repo.findById(id);

    if (!invoice) {
      throw new NotFoundError('Invoice não encontrada', undefined, { id });
    }

    return invoice;
  }
}
