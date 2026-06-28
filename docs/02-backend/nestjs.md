# NestJS Setup

## Visão Geral

Este documento define como o **NestJS** será configurado no Payment Flow.

O objetivo é estabelecer uma base limpa, escalável e alinhada com arquitetura orientada a eventos.

---

# Estrutura inicial do projeto

```text id="nest_tree1"
apps/
  api/
    src/
      main.ts
      app.module.ts

      modules/
      shared/
      config/
```

---

# Bootstrap da aplicação

## main.ts

```ts id="nest_main1"
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: '*',
  });

  await app.listen(3000);
}
bootstrap();
```

---

# AppModule

Responsável por orquestrar todos os módulos.

```ts id="nest_app1"
@Module({
  imports: [
    AuthModule,
    CustomersModule,
    ChargesModule,
    PaymentsModule,
    InvoicesModule,
    NotificationsModule,
    TimelineModule,
    SimulatorModule,
  ],
})
export class AppModule {}
```

---

# Organização por módulos

Cada módulo segue a estrutura:

```text id="nest_mod1"
modules/
  charges/
    domain/
    application/
    infrastructure/
    presentation/
    charges.module.ts
```

---

# Padrão de módulos

## charges.module.ts

```ts id="nest_mod2"
@Module({
  controllers: [ChargesController],
  providers: [
    CreateChargeUseCase,
    CancelChargeUseCase,
    ChargesRepository,
  ],
})
export class ChargesModule {}
```

---

# Separação de camadas

## Presentation

- Controllers REST
- GraphQL resolvers
- SSE gateways

---

## Application

- Use cases
- Orquestração de regras
- Fluxos de negócio

---

## Domain

- Entidades
- Regras puras
- Eventos

---

## Infrastructure

- MongoDB
- RabbitMQ
- External APIs

---

# Configuração global

## ConfigModule

Usado para variáveis de ambiente.

```ts id="nest_config1"
ConfigModule.forRoot({
  isGlobal: true,
});
```

---

## MongoDB

```ts id="nest_mongo1"
MongooseModule.forRoot(process.env.MONGO_URI)
```

---

## RabbitMQ

```ts id="nest_rmq1"
ClientsModule.register([
  {
    name: 'RABBITMQ',
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://localhost:5672'],
      queue: 'payment-flow',
    },
  },
]);
```

---

# Event System

NestJS será usado apenas como infraestrutura.

Eventos são emitidos via:

```ts id="nest_event1"
this.eventEmitter.emit('payment.approved', payload);
```

Ou via RabbitMQ para desacoplamento total.

---

# Controllers padrão

## Exemplo ChargesController

```ts id="nest_ctrl1"
@Controller('charges')
export class ChargesController {
  constructor(private createCharge: CreateChargeUseCase) {}

  @Post()
  async create(@Body() dto: CreateChargeDto) {
    return this.createCharge.execute(dto);
  }
}
```

---

# DTOs

Validação via class-validator:

```ts id="nest_dto1"
export class CreateChargeDto {
  @IsNumber()
  amount: number;

  @IsString()
  customerId: string;
}
```

---

# Pipes globais

## ValidationPipe

```ts id="nest_pipe1"
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
  }),
);
```

---

# Interceptors

Usados para:

- logging
- response shaping
- correlationId injection

---

# Guards

Responsáveis por:

- autenticação JWT
- autorização básica

---

# Exception Filter

Centraliza erros da aplicação:

```ts id="nest_ex1"
@Catch()
export class AllExceptionsFilter {}
```

---

# Princípios do setup

- Controllers são finos
- UseCases fazem o trabalho
- Domain é puro
- Infrastructure é substituível
- Tudo pode virar microservice depois

---

# Integração com arquitetura geral

```text id="nest_flow1"
Controller
  ↓
Use Case
  ↓
Domain
  ↓
Repository
  ↓
MongoDB

+ Events → RabbitMQ → Consumers
```

---

# Objetivo do setup

Este setup garante:

- escalabilidade futura
- separação clara de responsabilidades
- facilidade de testes
- evolução para microsserviços
- suporte a arquitetura event-driven

---

# Próximo documento

```
module-structure.md
```

Aqui vamos detalhar exatamente como cada módulo (charges, payments etc.) será estruturado dentro do NestJS.
```