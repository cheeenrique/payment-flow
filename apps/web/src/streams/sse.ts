import type { SseEvent, EventHandlerMap } from '@/streams/dispatcher'
import { dispatch } from '@/streams/dispatcher'
import { createReconnect } from '@/streams/reconnect'

/** Retorno de `createEventStream` — permite encerrar a conexão manualmente */
export interface EventStreamHandle {
  close: () => void
}

/**
 * Abre uma conexão SSE autenticada com o backend.
 *
 * - URL: `${VITE_API_URL}/events/stream?token=<jwt>`
 * - Em caso de erro, reconecta com backoff exponencial (1s → 10s)
 * - `close()` cancela qualquer timer de reconexão pendente
 */
export function createEventStream(
  token: string,
  handlers: EventHandlerMap,
  onRawEvent?: (event: SseEvent) => void,
): EventStreamHandle {
  const baseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3100'
  let source: EventSource | null = null
  let closed = false
  const reconnect = createReconnect({ baseMs: 1_000, maxMs: 10_000 })

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

      reconnect.schedule(connect)
    }

    source.onopen = (): void => {
      reconnect.reset()
    }
  }

  connect()

  return {
    close(): void {
      closed = true
      reconnect.cancel()
      source?.close()
      source = null
    },
  }
}
