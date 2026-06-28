import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';
import {
  ProcessPaymentSimulationUseCase,
  type SimulatorPaymentMethod,
} from '@/modules/simulator/application/use-cases/process-payment-simulation.use-case';

/**
 * Consumer RabbitMQ que intercepta pagamentos em processamento e aciona o motor de simulação.
 *
 * Substitui o antigo ChargeCreatedConsumer (que escutava charge.created.v1).
 * Agora opera sobre paymentId — o simulador conhece o ID do pagamento desde o início,
 * eliminando o mapeamento chargeId→paymentId que existia na decisão paralela antiga.
 *
 * Padrão compartilhado: o mesmo routing key 'payment.processing.v1' é consumido
 * por timeline e eventualmente outros módulos. Por isso, este handler:
 *   - NÃO faz ACK/NACK manual (evita double-ack com handlers encadeados)
 *   - Captura erros internamente e retorna normalmente
 *   - Implementa idempotência via SimulatorConfig + setTimeout não-bloqueante
 */
@Controller()
export class PaymentProcessingConsumer {
  private readonly logger = new Logger(PaymentProcessingConsumer.name);

  constructor(
    private readonly processSimulation: ProcessPaymentSimulationUseCase,
  ) {}

  @EventPattern('payment.processing.v1')
  async handle(@Payload() event: IntegrationEvent): Promise<void> {
    // aggregateId carrega o paymentId conforme contrato do PaymentProcessingEvent
    const paymentId = event.aggregateId;
    const method = event.payload['method'] as SimulatorPaymentMethod;
    const correlationId = event.correlationId ?? randomUUID();

    this.logger.log(
      `Simulação iniciada: paymentId=${paymentId} method=${method} correlationId=${correlationId}`,
    );

    try {
      await this.processSimulation.execute({ paymentId, method, correlationId });
    } catch (err: unknown) {
      this.logger.error(
        `Falha ao iniciar simulação — paymentId=${paymentId} correlationId=${correlationId}`,
        err instanceof Error ? err.stack : String(err),
      );
      // Não relança: padrão compartilhado, sem controle de ACK individual
    }
  }
}
