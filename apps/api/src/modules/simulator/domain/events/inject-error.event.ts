import { randomUUID } from 'node:crypto';
import type { IntegrationEvent } from '@/shared/events/integration-event.interface';

/**
 * Evento publicado quando o simulador injeta um erro sistêmico do PSP.
 * Representa falhas de rede, timeout ou indisponibilidade da adquirente.
 * Routing key: simulator.inject_error.v1
 */
export class InjectErrorEvent implements IntegrationEvent {
  readonly id = randomUUID();
  readonly type = 'simulator.inject_error.v1';
  readonly timestamp = new Date();
  readonly payload: Record<string, unknown>;

  constructor(
    readonly aggregateId: string,
    readonly correlationId: string,
    errorDescription: string,
  ) {
    this.payload = {
      errorDescription,
      simulatedAt: this.timestamp.toISOString(),
    };
  }
}
