import { Module } from '@nestjs/common';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { EventBusService } from './event-bus.service';
import { MessagingSetupService } from './messaging-setup.service';
import { EVENT_BUS } from './messaging.tokens';

// EVENT_BUS reexportado por compatibilidade com imports existentes.
export { EVENT_BUS };

/**
 * Argumentos de dead-letter para a fila 'payment-flow'.
 *
 * Exportado para uso em main.ts (connectMicroservice), garantindo que
 * publisher e consumer declarem a fila com os mesmos argumentos.
 * Argumentos divergentes causam PRECONDITION_FAILED no broker.
 *
 * x-dead-letter-exchange: '' → usa o exchange padrão (direct).
 * x-dead-letter-routing-key  → nome da DLQ, roteada pelo exchange padrão.
 */
export const PAYMENT_FLOW_QUEUE_ARGS = {
  'x-dead-letter-exchange': '',
  'x-dead-letter-routing-key': 'payment-flow.dlq',
} as const;

@Module({
  providers: [
    // Provider local do ClientProxy RMQ — token pertence ao RabbitModule,
    // então resolve nos providers internos e pode ser exportado direto.
    {
      provide: EVENT_BUS,
      useFactory: (config: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.RMQ,
          options: {
            urls: [config.getOrThrow<string>('RABBITMQ_URL')],
            queue: 'payment-flow',
            queueOptions: {
              durable: true,
              arguments: PAYMENT_FLOW_QUEUE_ARGS,
            },
          },
        }),
      inject: [ConfigService],
    },
    EventBusService,
    MessagingSetupService,
  ],
  exports: [EVENT_BUS, EventBusService],
})
export class RabbitModule {}
