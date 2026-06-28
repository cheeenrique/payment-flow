import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Infra — banco de dados
import { SimulatorConfigModel, SimulatorConfigSchema } from './infrastructure/database/simulator-config.schema';
import { MongoSimulatorConfigRepository } from './infrastructure/repositories/mongo-simulator-config.repository';
import { ScheduledVerdictModel, ScheduledVerdictSchema } from './infrastructure/database/scheduled-verdict.schema';
import { MongoScheduledVerdictRepository } from './infrastructure/repositories/mongo-scheduled-verdict.repository';

// Infra — mensageria
import { PaymentProcessingConsumer } from './infrastructure/messaging/payment-processing.consumer';

// Infra — jobs
import { SimulationVerdictScheduler } from './infrastructure/jobs/simulation-verdict.scheduler';

// Application — casos de uso
import { GetSimulatorConfigUseCase } from './application/use-cases/get-simulator-config.use-case';
import { UpdateSimulatorConfigUseCase } from './application/use-cases/update-simulator-config.use-case';
import { ResetSimulatorConfigUseCase } from './application/use-cases/reset-simulator-config.use-case';
import { ProcessPaymentSimulationUseCase } from './application/use-cases/process-payment-simulation.use-case';

// Presentation — HTTP e GraphQL
import { SimulatorController } from './presentation/http/simulator.controller';
import { SimulatorResolver } from './presentation/graphql/simulator.resolver';

// Módulos de infra compartilhada (reutilizados — não recriados)
import { RabbitModule } from '@/infra/messaging/rabbit.module';
import { SseModule } from '@/infra/sse/sse.module';
import { AuthModule } from '@/modules/auth/auth.module';

// Tokens DI
import { SIMULATOR_CONFIG_REPOSITORY, SCHEDULED_VERDICT_REPOSITORY } from './simulator.tokens';

/**
 * Módulo Simulator — motor de comportamento controlado do PSP artificial (MODELO A).
 *
 * Eventos consumidos (via @EventPattern — requer app híbrida):
 *   payment.processing.v1  →  PaymentProcessingConsumer
 *
 * Eventos publicados (via EventBusService → RabbitMQ):
 *   simulator.payment.approved.v1
 *   simulator.payment.failed.v1
 *   simulator.payment.delay.v1
 *
 * Eventos SSE emitidos (via SseService → frontend):
 *   simulator.payment.approved
 *   simulator.payment.failed
 *   simulator.payment.delay
 *
 * Durabilidade (12-factor #9 — disposability):
 *   Vereditos com delay > 0 são persistidos na collection simulator_scheduled_verdicts.
 *   SimulationVerdictScheduler (@Cron a cada 10s) processa os vencidos e publica o evento.
 *   Restarts/redeploys não perdem vereditos pendentes.
 *
 * Para ativar: adicionar SimulatorModule ao AppModule.imports
 */
@Module({
  imports: [
    // Schemas Mongoose para persistência
    MongooseModule.forFeature([
      { name: SimulatorConfigModel.name, schema: SimulatorConfigSchema },
      { name: ScheduledVerdictModel.name, schema: ScheduledVerdictSchema },
    ]),
    // Reutiliza infra existente sem recriar providers
    RabbitModule,
    SseModule,
    AuthModule,
  ],
  controllers: [
    SimulatorController,
    // Consumer registrado como controller para que @EventPattern seja reconhecido pelo NestJS
    PaymentProcessingConsumer,
  ],
  providers: [
    // Repositórios — DIP: token símbolo → implementação concreta Mongoose
    { provide: SIMULATOR_CONFIG_REPOSITORY, useClass: MongoSimulatorConfigRepository },
    { provide: SCHEDULED_VERDICT_REPOSITORY, useClass: MongoScheduledVerdictRepository },

    // Application — casos de uso
    GetSimulatorConfigUseCase,
    UpdateSimulatorConfigUseCase,
    ResetSimulatorConfigUseCase,
    ProcessPaymentSimulationUseCase,

    // Jobs — scheduler durável de vereditos (requer ScheduleModule.forRoot() no AppModule)
    SimulationVerdictScheduler,

    // Presentation — resolver GraphQL code-first
    SimulatorResolver,
  ],
})
export class SimulatorModule {}
