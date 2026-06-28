import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RabbitModule } from '@/infra/messaging/rabbit.module';
import { SseModule } from '@/infra/sse/sse.module';
import { AuthModule } from '@/modules/auth/auth.module';

import { CustomerModel, CustomerSchema } from './infrastructure/database/customer.schema';
import { MongoCustomerRepository } from './infrastructure/repositories/mongo-customer.repository';

import { CreateCustomerUseCase } from './application/use-cases/create-customer.use-case';
import { UpdateCustomerUseCase } from './application/use-cases/update-customer.use-case';
import { DeactivateCustomerUseCase } from './application/use-cases/deactivate-customer.use-case';
import { FindCustomerUseCase } from './application/use-cases/find-customer.use-case';
import { ListCustomersUseCase } from './application/use-cases/list-customers.use-case';

import { CustomersController } from './presentation/http/customers.controller';
import { CustomersResolver } from './presentation/graphql/customers.resolver';

import { CUSTOMER_REPOSITORY } from './customers.tokens';

@Module({
  imports: [
    // Schema Mongoose registrado na feature — não polui o módulo raiz
    MongooseModule.forFeature([
      { name: CustomerModel.name, schema: CustomerSchema },
    ]),
    // EventBusService (RabbitMQ) para publicação de eventos de integração
    RabbitModule,
    // SseService para push em tempo real ao dashboard
    SseModule,
    // JwtAuthGuard + PassportModule exportados pelo AuthModule
    AuthModule,
  ],
  controllers: [CustomersController],
  providers: [
    // DIP: token simbólico → implementação concreta (Mongo)
    { provide: CUSTOMER_REPOSITORY, useClass: MongoCustomerRepository },

    // Use cases — camada de aplicação
    CreateCustomerUseCase,
    UpdateCustomerUseCase,
    DeactivateCustomerUseCase,
    FindCustomerUseCase,
    ListCustomersUseCase,

    // GraphQL — resolver code-first (query side)
    CustomersResolver,
  ],
  exports: [
    // Exportado para módulos dependentes (ex: Charges) que precisam validar cliente
    CUSTOMER_REPOSITORY,
    FindCustomerUseCase,
  ],
})
export class CustomersModule {}
