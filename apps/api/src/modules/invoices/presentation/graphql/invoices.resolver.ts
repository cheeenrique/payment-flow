import { Args, Query, Resolver } from '@nestjs/graphql';
import { Invoice } from '@/modules/invoices/domain/entities/invoice.entity';
import { FindInvoiceUseCase } from '@/modules/invoices/application/use-cases/find-invoice.use-case';
import { FindInvoiceByPaymentUseCase } from '@/modules/invoices/application/use-cases/find-invoice-by-payment.use-case';
import { InvoiceType } from './types/invoice.type';

/**
 * Resolver GraphQL code-first para consultas de notas fiscais.
 * Segue o padrão CQRS pragmático do sistema: GraphQL = leitura.
 *
 * Nota: para proteção via JWT em contexto GraphQL é necessário um guard
 * que acesse GqlExecutionContext (a ser implementado junto ao GraphQLModule).
 */
@Resolver(() => InvoiceType)
export class InvoicesResolver {
  constructor(
    private readonly findInvoice: FindInvoiceUseCase,
    private readonly findInvoiceByPayment: FindInvoiceByPaymentUseCase,
  ) {}

  /** Consulta nota fiscal pelo ID (lança erro 404 se não encontrada) */
  @Query(() => InvoiceType, { name: 'invoice' })
  async getInvoice(@Args('id') id: string): Promise<InvoiceType> {
    const invoice = await this.findInvoice.execute(id);
    return this.toType(invoice);
  }

  /**
   * Consulta nota fiscal pelo ID do pagamento.
   * Retorna null se ainda não existe invoice para o pagamento.
   */
  @Query(() => InvoiceType, { name: 'invoiceByPayment', nullable: true })
  async getInvoiceByPayment(
    @Args('paymentId') paymentId: string,
  ): Promise<InvoiceType | null> {
    const invoice = await this.findInvoiceByPayment.execute(paymentId).catch(() => null);
    return invoice ? this.toType(invoice) : null;
  }

  /** Mapeia entidade de domínio para o tipo GraphQL */
  private toType(invoice: Invoice): InvoiceType {
    const type = new InvoiceType();
    type.id = invoice.id;
    type.paymentId = invoice.paymentId;
    type.chargeId = invoice.chargeId;
    type.customerId = invoice.customerId;
    type.amount = invoice.amount;
    type.status = invoice.status;
    type.issuedAt = invoice.issuedAt;
    type.externalReference = invoice.externalReference;
    type.createdAt = invoice.createdAt;
    type.updatedAt = invoice.updatedAt;
    return type;
  }
}
