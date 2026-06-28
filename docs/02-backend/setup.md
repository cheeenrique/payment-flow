# Backend Setup (NestJS)

## Visão Geral

Este documento define o setup completo do backend do Payment Flow.

Ele cobre:

- NestJS inicialização
- MongoDB
- RabbitMQ
- SSE Gateway
- Auth (JWT)
- configuração de ambiente
- docker-compose

---

# Stack do backend

## Core

- NestJS
- TypeScript
- MongoDB (Mongoose ou Prisma Mongo)
- RabbitMQ
- SSE (EventEmitter + HTTP stream)

---

# 1. Estrutura do projeto

```text id="be_tree1"
apps/api/
  src/
    modules/
    shared/
    infra/
    config/
    main.ts
```

---

# 2. Criar projeto NestJS

```bash id="be_cmd1"
npm i -g @nestjs/cli
nest new api
```

---

# 3. Dependências principais

## MongoDB

```bash id="be_cmd2"
npm install @nestjs/mongoose mongoose
```

---

## RabbitMQ (microservices)

```bash id="be_cmd3"
npm install @nestjs/microservices amqplib amqp-connection-manager
```

---

## Config system

```bash id="be_cmd4"
npm install @nestjs/config
```

---

## JWT Auth

```bash id="be_cmd5"
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```

---

## SSE support

```bash id="be_cmd6"
npm install rxjs
```

---

# 4. Docker Compose (infra)

## docker-compose.yml

```yaml id="be_docker1"
version: '3.8'

services:
  mongo:
    image: mongo:7
    container_name: payment-flow-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  rabbitmq:
    image: rabbitmq:3-management
    container_name: payment-flow-rabbit
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin

volumes:
  mongo_data:
```

---

# 5. Variáveis de ambiente

## .env.example

```env id="be_env1"
PORT=3000

MONGO_URL=mongodb://localhost:27017/payment-flow

RABBITMQ_URL=amqp://admin:admin@localhost:5672

JWT_SECRET=super-secret
JWT_EXPIRES_IN=15m

REFRESH_SECRET=refresh-secret
REFRESH_EXPIRES_IN=7d
```

---

# 6. Bootstrap do NestJS

## main.ts

```ts id="be_main1"
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: '*',
  });

  await app.listen(3000);
}
bootstrap();
```

---

# 7. Config Module

## config.module.ts

```ts id="be_config1"
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
})
export class AppConfigModule {}
```

---

# 8. MongoDB Connection

## database.module.ts

```ts id="be_db1"
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL),
  ],
})
export class DatabaseModule {}
```

---

# 9. RabbitMQ Connection

## rabbit.module.ts

```ts id="be_rabbit1"
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'EVENT_BUS',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: 'payment-flow',
        },
      },
    ]),
  ],
  exports: ['EVENT_BUS'],
})
export class RabbitModule {}
```

---

# 10. SSE Gateway

## events.controller.ts

```ts id="be_sse1"
import { Controller, Sse } from '@nestjs/common';
import { Observable, Subject } from 'rxjs';

@Controller('events')
export class EventsController {
  private stream$ = new Subject<any>();

  emit(event: any) {
    this.stream$.next(event);
  }

  @Sse('stream')
  stream(): Observable<any> {
    return this.stream$.asObservable();
  }
}
```

---

# 11. Ordem de inicialização

```text id="be_order1"
1. docker-compose up (Mongo + RabbitMQ)
2. NestJS start
3. Connect Mongo
4. Connect RabbitMQ
5. Start SSE Gateway
6. Frontend conecta via EventSource
```

---

# 12. Scripts úteis

```json id="be_scripts1"
{
  "start": "nest start",
  "start:dev": "nest start --watch",
  "build": "nest build"
}
```

---

# 13. Health check

## endpoint

```
GET /health
```

---

# 14. Boas práticas do backend

- nunca iniciar sem Mongo + RabbitMQ ativos
- eventos sempre versionados
- SSE não pode bloquear thread
- auth sempre global
- validation pipe obrigatório
- logs obrigatórios em eventos críticos

---

# 15. Resultado final

Após esse setup, você terá:

- backend pronto para event-driven architecture
- Mongo funcionando
- RabbitMQ funcionando
- SSE stream ativo
- auth preparado
- base para payments system real
```