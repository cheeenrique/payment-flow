import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transport } from '@nestjs/microservices';
import { AppModule } from '@/app.module';
import { PAYMENT_FLOW_QUEUE_ARGS } from '@/infra/messaging/rabbit.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({ origin: '*' });

  /**
   * Consumer RabbitMQ único para todos os domain events do sistema.
   *
   * ARQUITETURA (monólito modular — decisão KISS):
   *   Fila única 'payment-flow'. O NestJS roteia cada mensagem pelo @EventPattern
   *   para o handler correto em-processo — sem topic exchange por domínio.
   *
   * DEAD-LETTER (DLQ):
   *   Mensagens rejeitadas com NACK sem requeue são encaminhadas pelo broker
   *   para 'payment-flow.dlq' via x-dead-letter-exchange configurado nos
   *   queueOptions abaixo. O MessagingSetupService asserta ambas as filas no
   *   OnModuleInit para evitar descarte silencioso de mensagens mortas.
   *
   * RETRY:
   *   Handlers que usam @Ctx() controlam ACK/NACK manualmente:
   *     - Sucesso → channel.ack(msg)
   *     - Erro transitório (x-retry-count < RETRY_MAX_ATTEMPTS):
   *         channel.ack(msg) + EventBusService.republish(event, retryCount + 1)
   *     - Erro persistente (x-retry-count >= RETRY_MAX_ATTEMPTS):
   *         channel.nack(msg, false, false) → DLQ via broker
   *
   *   Handlers sem @Ctx() (padrões compartilhados por múltiplos consumers)
   *   capturam erros internamente e não fazem ack/nack explícito.
   *   Mensagens ficam unacked e são reenviadas no reconect — aceito pois
   *   todos os handlers são idempotentes.
   *
   * IMPORTANTE: queueOptions.arguments DEVE ser idêntico ao do publisher
   *   (rabbit.module.ts → PAYMENT_FLOW_QUEUE_ARGS). Divergência causa
   *   PRECONDITION_FAILED no broker ao redeclarar a fila.
   */
  app.connectMicroservice({
    transport: Transport.RMQ,
    options: {
      urls: [config.getOrThrow<string>('RABBITMQ_URL')],
      queue: 'payment-flow',
      queueOptions: {
        durable: true,
        arguments: PAYMENT_FLOW_QUEUE_ARGS,
      },
      noAck: false,
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = config.get<number>('PORT', 3000);

  // Sobe os microserviços (consumer RMQ) antes de abrir a porta HTTP.
  await app.startAllMicroservices();
  await app.listen(port);
}

void bootstrap();
