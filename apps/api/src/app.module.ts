import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AppConfigModule } from './config/app-config.module';
import { DatabaseModule } from './infra/database/database.module';
import { RabbitModule } from './infra/messaging/rabbit.module';
import { SseModule } from './infra/sse/sse.module';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { TransformInterceptor } from './shared/http/transform.interceptor';
import { HealthController } from './health.controller';
import { AuthModule } from './modules/auth/auth.module';
import { CustomersModule } from './modules/customers/customers.module';
import { ChargesModule } from './modules/charges/charges.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { TimelineModule } from './modules/timeline/timeline.module';
import { SimulatorModule } from './modules/simulator/simulator.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RabbitModule,
    SseModule,
    // GraphQL code-first: schema gerado a partir dos @ObjectType/@Resolver.
    // context expõe `req` para os guards GQL extraírem o token do header.
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // Schema code-first gerado em memória — independente do cwd
      // (start:prod roda de apps/api, evita path aninhado errado).
      autoSchemaFile: true,
      sortSchema: true,
      playground: true,
      context: ({ req }: { req: unknown }) => ({ req }),
    }),
    // Módulos de domínio (monólito modular).
    AuthModule,
    CustomersModule,
    ChargesModule,
    PaymentsModule,
    InvoicesModule,
    NotificationsModule,
    TimelineModule,
    SimulatorModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      // Envelopa todas as respostas REST de sucesso em { data, meta }.
      // Pula GraphQL (envelope nativo) e SSE (stream contínuo).
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
