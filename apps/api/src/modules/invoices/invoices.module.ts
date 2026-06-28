import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { InvoiceModel, InvoiceSchema } from './infrastructure/database/invoice.schema';
import { MongoInvoiceRepository } from './infrastructure/repositories/mongo-invoice.repository';
import { PaymentApprovedConsumer } from './infrastructure/messaging/payment-approved.consumer';

import { ProcessInvoiceUseCase } from './application/use-cases/process-invoice.use-case';
import { CreateInvoiceUseCase } from './application/use-cases/create-invoice.use-case';
import { FindInvoiceUseCase } from './application/use-cases/find-invoice.use-case';
import { FindInvoiceByPaymentUseCase } from './application/use-cases/find-invoice-by-payment.use-case';

import { InvoicesController } from './presentation/http/invoices.controller';
import { InvoicesResolver } from './presentation/graphql/invoices.resolver';

import { AuthModule } from '@/modules/auth/auth.module';
import { RabbitModule } from '@/infra/messaging/rabbit.module';
import { SseModule } from '@/infra/sse/sse.module';

import { INVOICE_REPOSITORY } from './invoices.tokens';

/**
 * Módulo de notas fiscais.
 *
 * Consome:  payment.approved.v1 (RabbitMQ)
 * Publica:  invoice.requested.v1 | invoice.processing.v1 | invoice.issued.v1 | invoice.failed.v1
 * SSE:      invoice.requested | invoice.processing | invoice.issued | invoice.failed
 *
 * REST:
 *   POST  /invoices/request       — emissão manual (protegido por JWT)
 *   GET   /invoices/:id           — consulta por ID (protegido por JWT)
 *   GET   /payments/:id/invoice   — consulta por paymentId (protegido por JWT)
 *
 * GraphQL (code-first):
 *   query invoice(id)             — consulta por ID
 *   query invoiceByPayment(id)    — consulta por paymentId (nullable)
 */
@Module({
  imports: [
    MongooseModule.forFeature([{ name: InvoiceModel.name, schema: InvoiceSchema }]),
    RabbitModule,
    SseModule,
    AuthModule,
  ],
  controllers: [
    InvoicesController,
    PaymentApprovedConsumer,   // consumer RabbitMQ: @EventPattern('payment.approved.v1')
  ],
  providers: [
    // Repositório via token DI (DIP: use cases não conhecem Mongoose)
    { provide: INVOICE_REPOSITORY, useClass: MongoInvoiceRepository },

    // Application — casos de uso (ProcessInvoiceUseCase declarado antes pois é dep de CreateInvoiceUseCase)
    ProcessInvoiceUseCase,
    CreateInvoiceUseCase,
    FindInvoiceUseCase,
    FindInvoiceByPaymentUseCase,

    // Presentation — resolver GraphQL
    InvoicesResolver,
  ],
})
export class InvoicesModule {}
