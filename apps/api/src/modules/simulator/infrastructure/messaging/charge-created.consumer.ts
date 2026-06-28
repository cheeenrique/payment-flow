import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { ProcessChargeSimulationUseCase } from '@/modules/simulator/application/use-cases/process-charge-simulation.use-case';
import type { PaymentMethod } from '@/modules/simulator/application/use-cases/process-charge-simulation.use-case';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Payload do evento charge.created.v1 publicado pelo módulo Charges.
 * O simulador depende apenas desta interface — nunca importa o módulo Charges diretamente.
 */
interface ChargeCreatedPayload {
  chargeId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  customerId: string;
}

type ChargeCreatedEvent = IntegrationEvent & { payload: ChargeCreatedPayload };

/**
 * Consumer RabbitMQ que intercepta cobranças criadas e aciona o motor de simulação.
 *
 * O padrão 'charge.created.v1' é compartilhado com timeline e notification:
 * o mesmo RmqContext (message/channel) é passado para todos os handlers encadeados.
 * Por isso, este handler NÃO faz ACK/NACK manual — capturas erros internamente
 * e retorna normalmente para evitar double-ack com os demais handlers.
 *
 * Retry: mensagens ficam unacked e são reenviadas no reconect (aceito pois
 * os handlers são idempotentes).
 */
@Controller()
export class ChargeCreatedConsumer {
  private readonly logger = new Logger(ChargeCreatedConsumer.name);

  constructor(
    private readonly processChargeSimulation: ProcessChargeSimulationUseCase,
  ) {}

  @EventPattern('charge.created.v1')
  async handle(@Payload() event: ChargeCreatedEvent): Promise<void> {
    const { chargeId, paymentMethod } = event.payload;
    // Reutiliza o correlationId da cobrança original para rastreabilidade end-to-end
    const correlationId = event.correlationId ?? randomUUID();

    this.logger.log(
      `Simulação iniciada: charge=${chargeId} method=${paymentMethod} correlationId=${correlationId}`,
    );

    try {
      await this.processChargeSimulation.execute({ chargeId, paymentMethod, correlationId });
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao processar simulação — chargeId=${chargeId} correlationId=${correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }
}
