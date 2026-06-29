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
 * - Em caso de erro, reconecta com backoff exponencial até `RECONNECT_MAX_MS`
 * - `close()` cancela qualquer timer de reconexão pendente
 */
export function createEventStream(
  token: string,
  handlers: EventHandlerMap,
  onRawEvent?: (event: SseEvent) => void,
): EventStreamHandle {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3100'
  let attempts = 0
  let source: EventSource | null = null
  let closed = false
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect(): void {
    if (closed) return

    const url = `${baseUrl}/events/stream?token=${encodeURIComponent(token)}`
    source = new EventSource(url)

    source.onmessage = (event: MessageEvent): void => {
      try {
        const data = JSON.parse(event.data) as SseEvent
        onRawEvent?.(data)
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
      reconnectTimer = setTimeout(connect, delay)
    }

    source.onopen = (): void => {
      attempts = 0
    }
  }

  connect()

  return {
    close(): void {
      closed = true
      if (reconnectTimer !== null) {
        clearTimeout(reconnectTimer)
        reconnectTimer = null
      }
      source?.close()
      source = null
    },
  }
}
