import type { ConsumeMessage } from 'amqplib';

/**
 * Número máximo de tentativas antes de encaminhar para a DLQ.
 *
 * Contagem inclui a entrega original:
 *   x-retry-count ausente = primeira entrega (tentativa 0)
 *   x-retry-count = 1     = segunda entrega (primeiro retry)
 *   x-retry-count = 3     = quarta entrega → DLQ
 */
export const RETRY_MAX_ATTEMPTS = 3;

/**
 * Extrai o contador de retentativas do header AMQP `x-retry-count`.
 *
 * O header é inserido pelo EventBusService.republish() a cada nova tentativa.
 * Retorna 0 se a mensagem nunca passou por ciclo de retry (entrega original).
 */
export function getRetryCount(message: ConsumeMessage): number {
  const raw = message.properties.headers?.['x-retry-count'];
  if (raw === undefined || raw === null) return 0;
  const count = Number(raw);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

/**
 * Retorna true se o número de tentativas já atingiu ou superou o limite.
 * Quando true, o handler deve encaminhar para DLQ via NACK sem requeue.
 */
export function hasExceededRetryLimit(message: ConsumeMessage): boolean {
  return getRetryCount(message) >= RETRY_MAX_ATTEMPTS;
}
