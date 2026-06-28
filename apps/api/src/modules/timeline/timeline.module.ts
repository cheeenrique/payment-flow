import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  TimelineEventModel,
  TimelineEventSchema,
} from './infrastructure/database/timeline-event.schema';
import { MongoTimelineEventRepository } from './infrastructure/repositories/mongo-timeline-event.repository';
import { RecordEventUseCase } from './application/use-cases/record-event.use-case';
import { ListEventsUseCase } from './application/use-cases/list-events.use-case';
import { TimelineConsumer } from './infrastructure/messaging/timeline.consumer';
import { TimelineResolver } from './presentation/graphql/timeline.resolver';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';

import { RabbitModule } from '@/infra/messaging/rabbit.module';
import { SseModule } from '@/infra/sse/sse.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { TIMELINE_EVENT_REPOSITORY } from './timeline.tokens';

/**
 * Módulo Timeline — projeção append-only de todos os domain events do sistema.
 *
 * Importar em AppModule para ativar:
 *  - Consumer RabbitMQ (TimelineConsumer) — requer connectMicroservice() em main.ts
 *  - Queries GraphQL (TimelineResolver) — requer GraphQLModule no AppModule
 *  - Push SSE ao frontend após cada evento registrado
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimelineEventModel.name, schema: TimelineEventSchema },
    ]),
    RabbitModule,   // EventBusService disponível (publisher reutilizável)
    SseModule,      // SseService para push em tempo real ao frontend
    AuthModule,     // JwtAuthGuard + JwtStrategy + PassportModule exportados
  ],
  controllers: [
    TimelineConsumer, // @EventPattern — ativo quando connectMicroservice está configurado
  ],
  providers: [
    // Repositório via DIP: símbolo abstrato → implementação concreta Mongoose
    { provide: TIMELINE_EVENT_REPOSITORY, useClass: MongoTimelineEventRepository },

    // Casos de uso — escrita e leitura separados (CQRS pragmático)
    RecordEventUseCase,
    ListEventsUseCase,

    // Apresentação GraphQL
    TimelineResolver,
    GqlAuthGuard,
  ],
})
export class TimelineModule {}
