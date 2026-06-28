import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// Infra — banco de dados
import { SimulatorConfigModel, SimulatorConfigSchema } from './infrastructure/database/simulator-config.schema';
import { MongoSimulatorConfigRepository } from './infrastructure/repositories/mongo-simulator-config.repository';

// Infra — mensageria
import { PaymentProcessingConsumer } from './infrastructure/messaging/payment-processing.consumer';

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

// Token DI
import { SIMULATOR_CONFIG_REPOSITORY } from './simulator.tokens';

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
 * Para ativar: adicionar SimulatorModule ao AppModule.imports
 */
@Module({
  imports: [
    // Schema Mongoose para persistência da configuração global
    MongooseModule.forFeature([
      { name: SimulatorConfigModel.name, schema: SimulatorConfigSchema },
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
    // Repositório — DIP: token símbolo → implementação concreta Mongoose
    { provide: SIMULATOR_CONFIG_REPOSITORY, useClass: MongoSimulatorConfigRepository },

    // Application — casos de uso
    GetSimulatorConfigUseCase,
    UpdateSimulatorConfigUseCase,
    ResetSimulatorConfigUseCase,
    ProcessPaymentSimulationUseCase,

    // Presentation — resolver GraphQL code-first
    SimulatorResolver,
  ],
})
export class SimulatorModule {}
