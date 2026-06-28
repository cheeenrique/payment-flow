import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqplib from 'amqplib';

/** Fila principal de domain events */
const MAIN_QUEUE = 'payment-flow';

/** Fila de mensagens mortas — destino de NACK sem requeue na fila principal */
const DLQ_QUEUE = 'payment-flow.dlq';

/**
 * Asserta as filas de mensageria no broker antes do início do consumo.
 *
 * Executado em OnModuleInit (antes de startAllMicroservices), garantindo que:
 *   1. 'payment-flow' existe com os argumentos de dead-letter corretos.
 *   2. 'payment-flow.dlq' existe para receber mensagens rejeitadas.
 *
 * Sem esse passo, mensagens dead-letteradas seriam descartadas silenciosamente
 * pelo broker quando o exchange padrão ('') tenta rotear para uma fila
 * inexistente pelo routing key 'payment-flow.dlq'.
 *
 * ATENÇÃO — migração: se 'payment-flow' já existe no broker sem os argumentos
 * de dead-letter, o RabbitMQ retorna PRECONDITION_FAILED. Solução: deletar a
 * fila manualmente via management UI e reiniciar a aplicação.
 */
@Injectable()
export class MessagingSetupService implements OnModuleInit {
  private readonly logger = new Logger(MessagingSetupService.name);

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.assertQueues();
    } catch (err: unknown) {
      this.logger.error(
        'Falha ao declarar filas de mensageria — verifique se o RabbitMQ está acessível ' +
          'e se a fila payment-flow não existe com argumentos divergentes',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private async assertQueues(): Promise<void> {
    const url = this.config.getOrThrow<string>('RABBITMQ_URL');
    const connection = await amqplib.connect(url);
    const channel = await connection.createChannel();

    try {
      // Fila principal: declarada com dead-letter apontando para a DLQ.
      // Os arguments DEVEM ser idênticos ao queueOptions do connectMicroservice
      // (main.ts) e do publisher (rabbit.module.ts) para evitar PRECONDITION_FAILED.
      await channel.assertQueue(MAIN_QUEUE, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': DLQ_QUEUE,
        },
      });

      // DLQ: durable, sem dead-letter — mensagens ficam aqui para análise manual.
      await channel.assertQueue(DLQ_QUEUE, { durable: true });

      this.logger.log(
        `Filas declaradas com sucesso: ${MAIN_QUEUE} (dead-letter → ${DLQ_QUEUE})`,
      );
    } finally {
      await channel.close();
      await connection.close();
    }
  }
}
