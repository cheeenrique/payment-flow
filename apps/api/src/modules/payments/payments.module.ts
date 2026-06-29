import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { PaymentModel, PaymentSchema } from './infrastructure/database/payment.schema';
import { MongoPaymentRepository } from './infrastructure/repositories/mongo-payment.repository';
import { PaymentEventsConsumer } from './infrastructure/messaging/payment-events.consumer';
import { SimulatorVerdictConsumer } from './infrastructure/messaging/simulator-verdict.consumer';
import { ChargeExpiredConsumer } from './infrastructure/messaging/charge-expired.consumer';

import { CreatePaymentUseCase } from './application/use-cases/create-payment.use-case';
import { ProcessPaymentUseCase } from './application/use-cases/process-payment.use-case';
import { FindPaymentUseCase } from './application/use-cases/find-payment.use-case';
import { FindPaymentsByChargeUseCase } from './application/use-cases/find-payments-by-charge.use-case';
import { ListPaymentsUseCase } from './application/use-cases/list-payments.use-case';

import { PaymentsController } from './presentation/http/payments.controller';
import { PaymentsResolver } from './presentation/graphql/payments.resolver';

import { RabbitModule } from '@/infra/messaging/rabbit.module';
import { SseModule } from '@/infra/sse/sse.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { PAYMENT_REPOSITORY } from './payments.tokens';

@Module({
  imports: [
    // Registra o schema Mongoose para a collection "payments"
    MongooseModule.forFeature([
      { name: PaymentModel.name, schema: PaymentSchema },
    ]),
    // Infraestrutura compartilhada: mensageria e SSE
    RabbitModule,
    SseModule,
    // Autenticação: expõe JwtAuthGuard e PassportModule para guards nos controllers/resolvers
    AuthModule,
  ],
  controllers: [
    // HTTP — command-side (REST)
    PaymentsController,
    // Microservice — consumer exclusivo de charge.payment_requested.v1 (ACK/NACK manual)
    PaymentEventsConsumer,
    // Microservice — consumer de vereditos do simulador (simulator.payment.approved/failed.v1)
    SimulatorVerdictConsumer,
    // Microservice — expira pagamentos ativos quando a cobrança associada expira (charge.expired.v1)
    ChargeExpiredConsumer,
  ],
  providers: [
    // Repositório: token DI → implementação concreta (DIP)
    { provide: PAYMENT_REPOSITORY, useClass: MongoPaymentRepository },

    // Casos de uso — camada de aplicação
    CreatePaymentUseCase,
    ProcessPaymentUseCase,
    FindPaymentUseCase,
    FindPaymentsByChargeUseCase,
    ListPaymentsUseCase,

    // GraphQL resolver — query-side
    PaymentsResolver,
  ],
  exports: [
    // Repositório exportado para leitura cross-module (ex: DashboardModule — CQRS read side)
    PAYMENT_REPOSITORY,
  ],
})
export class PaymentsModule {}
