import type { SseEvent, EventHandlerMap } from '@/streams/dispatcher'
import { dispatch } from '@/streams/dispatcher'

/** Retorno de `createEventStream` — permite encerrar a conexão manualmente */
export interface EventStreamHandle {
  close: () => void
}

const RECONNECT_MAX_MS = 10_000
const RECONNECT_BASE_MS = 1_000

/**
 * Abre uma conexão SSE autenticada com o backend.
 *
 * - URL: `${VITE_API_URL}/events/stream?token=<jwt>`
 * - Cada mensagem é deserializada e despachada via `dispatch`
 * - Em caso de erro, a conexão é fechada e reconectada com backoff exponencial
 *   limitado a `min(1000 * attempts, 10000)` ms
 */
export function createEventStream(
  token: string,
  handlers: EventHandlerMap,
): EventStreamHandle {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3100'
  let attempts = 0
  let source: EventSource | null = null
  let closed = false

  function connect(): void {
    if (closed) return

    const url = `${baseUrl}/events/stream?token=${encodeURIComponent(token)}`
    source = new EventSource(url)

    source.onmessage = (event: MessageEvent): void => {
      try {
        const data = JSON.parse(event.data) as SseEvent
        dispatch(data, handlers)
      } catch {
        // Mensagem malformada — ignora sem derrubar a conexão
      }
    }

    source.onerror = (): void => {
      source?.close()
      source = null

      if (closed) return

      attempts += 1
      const delay = Math.min(RECONNECT_BASE_MS * attempts, RECONNECT_MAX_MS)
      setTimeout(connect, delay)
    }

    source.onopen = (): void => {
      // Reconectou com sucesso — reseta contador de tentativas
      attempts = 0
    }
  }

  connect()

  return {
    close(): void {
      closed = true
      source?.close()
      source = null
    },
  }
}
