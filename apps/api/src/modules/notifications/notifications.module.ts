import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  NotificationModel,
  NotificationSchema,
} from './infrastructure/database/notification.schema';
import { MongoNotificationRepository } from './infrastructure/repositories/mongo-notification.repository';
import { NotificationConsumer } from './infrastructure/messaging/notification.consumer';

import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { ListNotificationsUseCase } from './application/use-cases/list-notifications.use-case';
import { GetNotificationUseCase } from './application/use-cases/get-notification.use-case';
import { MarkAsReadUseCase } from './application/use-cases/mark-as-read.use-case';

import { NotificationsController } from './presentation/http/notifications.controller';
import { NotificationsResolver } from './presentation/graphql/notifications.resolver';
import { GqlAuthGuard } from '@/modules/auth/presentation/graphql/gql-auth.guard';

import { AuthModule } from '@/modules/auth/auth.module';
import { SseModule } from '@/infra/sse/sse.module';
import { NOTIFICATION_REPOSITORY } from './notifications.tokens';

/**
 * Módulo de notificações do sistema.
 *
 * Responsabilidades:
 *  - Consumir eventos do RabbitMQ e transformá-los em notificações (NotificationConsumer)
 *  - Persistir notificações no MongoDB (MongoNotificationRepository)
 *  - Emitir notificações em tempo real via SSE (CreateNotificationUseCase → SseService)
 *  - Expor REST para leitura e marcação como lida (NotificationsController)
 *  - Expor GraphQL para consulta de notificações (NotificationsResolver)
 *
 * Dependências externas:
 *  - AuthModule: fornece JwtAuthGuard, JwtStrategy e PassportModule
 *  - SseModule: fornece SseService para push em tempo real
 *
 * Para ativar o consumer RabbitMQ, o main.ts deve chamar:
 *   app.connectMicroservice({ transport: Transport.RMQ, options: { queue: 'notifications.queue', ... } })
 *   await app.startAllMicroservices()
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationModel.name, schema: NotificationSchema },
    ]),
    AuthModule,
    SseModule,
  ],
  controllers: [
    NotificationsController,
    // Consumer de eventos RabbitMQ — ativado via connectMicroservice no main.ts
    NotificationConsumer,
  ],
  providers: [
    // Repositório via DIP: token de símbolo → implementação concreta Mongo
    { provide: NOTIFICATION_REPOSITORY, useClass: MongoNotificationRepository },

    // Casos de uso da camada de aplicação
    CreateNotificationUseCase,
    ListNotificationsUseCase,
    GetNotificationUseCase,
    MarkAsReadUseCase,

    // Apresentação — GraphQL
    NotificationsResolver,
    GqlAuthGuard,
  ],
})
export class NotificationsModule {}
