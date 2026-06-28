import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ChargeModel, ChargeSchema } from './infrastructure/database/charge.schema';
import { MongoChargeRepository } from './infrastructure/repositories/mongo-charge.repository';
import { PaymentResultConsumer } from './infrastructure/messaging/payment-result.consumer';
import { ChargeExpirationScheduler } from './infrastructure/jobs/charge-expiration.scheduler';

import { CreateChargeUseCase } from './application/use-cases/create-charge.use-case';
import { CancelChargeUseCase } from './application/use-cases/cancel-charge.use-case';
import { GetChargeUseCase } from './application/use-cases/get-charge.use-case';
import { ListChargesUseCase } from './application/use-cases/list-charges.use-case';
import { ExpireChargeUseCase } from './application/use-cases/expire-charge.use-case';
import { GetChargeByTokenUseCase } from './application/use-cases/get-charge-by-token.use-case';
import { ConfirmPaymentLinkUseCase } from './application/use-cases/confirm-payment-link.use-case';

import { ChargesController } from './presentation/http/charges.controller';
import { PublicChargesController } from './presentation/public/public-charges.controller';
import { ChargesResolver } from './presentation/graphql/charges.resolver';

import { RabbitModule } from '@/infra/messaging/rabbit.module';
import { SseModule } from '@/infra/sse/sse.module';
import { AuthModule } from '@/modules/auth/auth.module';

import { CHARGE_REPOSITORY } from './charges.tokens';

/**
 * Módulo de cobranças (charges).
 *
 * Importações:
 *   - MongooseModule: registra schema da collection "charges"
 *   - RabbitModule: fornece EventBusService para publicar eventos de integração
 *   - SseModule: fornece SseService para notificações em tempo real ao dashboard
 *   - AuthModule: expõe JwtAuthGuard e PassportModule para proteção das rotas
 *
 * Exportações:
 *   - ExpireChargeUseCase: disponível para o Simulator module (acesso via import)
 *   - GetChargeUseCase: disponível para consultas cross-module se necessário
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChargeModel.name, schema: ChargeSchema },
    ]),
    RabbitModule,
    SseModule,
    AuthModule,
  ],
  controllers: [
    ChargesController,
    PublicChargesController,
    // Microservice — consumer de resultados de pagamento (payment.approved/failed/expired.v1)
    PaymentResultConsumer,
  ],
  providers: [
    // Repositório via DIP: token simbólico → implementação Mongoose
    { provide: CHARGE_REPOSITORY, useClass: MongoChargeRepository },

    // Casos de uso da camada de aplicação
    CreateChargeUseCase,
    CancelChargeUseCase,
    GetChargeUseCase,
    GetChargeByTokenUseCase,
    ConfirmPaymentLinkUseCase,
    ListChargesUseCase,
    ExpireChargeUseCase,

    // Scheduler de expiração: cron in-process que expira cobranças vencidas
    ChargeExpirationScheduler,

    // Resolver GraphQL code-first (lado de leitura)
    ChargesResolver,
  ],
  exports: [
    // Repositório exportado para leitura cross-module (ex: DashboardModule — CQRS read side)
    CHARGE_REPOSITORY,
    // Casos de uso exportados para o Simulator e módulos de infraestrutura
    ExpireChargeUseCase,
    GetChargeUseCase,
    GetChargeByTokenUseCase,
    ListChargesUseCase,
  ],
})
export class ChargesModule {}
