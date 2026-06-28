/** Shape de todo evento SSE recebido do backend */
export interface SseEvent<P = unknown> {
  type: string
  timestamp: string
  correlationId: string
  payload: P
}

/** Função handler chamada com o payload de um evento específico */
export type EventHandler<P = unknown> = (payload: P) => void

/** Mapa de tipo de evento para seu handler correspondente */
export type EventHandlerMap = Record<string, EventHandler>

/**
 * Roteia o evento para o handler registrado pelo seu `type`.
 * Tipos sem handler registrado resultam em no-op silencioso.
 */
export function dispatch(event: SseEvent, handlers: EventHandlerMap): void {
  const handler = handlers[event.type]

  if (handler === undefined) {
    return
  }

  handler(event.payload)
}
