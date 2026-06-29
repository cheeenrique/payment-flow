/** Opções para o helper de reconnect com backoff exponencial */
export interface ReconnectOptions {
  /** Delay base em ms (default: 1000) */
  baseMs?: number
  /** Delay máximo em ms (default: 10000) */
  maxMs?: number
}

/** Retorno de `createReconnect` */
export interface ReconnectHandle {
  /** Agenda o callback com delay exponencial baseado nas tentativas anteriores */
  schedule: (callback: () => void) => void
  /** Cancela qualquer timer pendente e reseta o contador de tentativas */
  cancel: () => void
  /** Reseta o contador de tentativas (chamar após reconexão bem-sucedida) */
  reset: () => void
}

/**
 * Cria um helper de reconnect com backoff exponencial.
 * O delay cresce linearmente por tentativa até `maxMs`:
 * `min(baseMs * attempt, maxMs)`.
 *
 * Uso:
 * ```ts
 * const reconnect = createReconnect({ baseMs: 1000, maxMs: 10000 })
 * reconnect.schedule(() => connect())  // agenda próximo connect
 * reconnect.cancel()                   // cancela ao fechar
 * reconnect.reset()                    // chama ao conectar com sucesso
 * ```
 */
export function createReconnect(options: ReconnectOptions = {}): ReconnectHandle {
  const baseMs = options.baseMs ?? 1_000
  const maxMs = options.maxMs ?? 10_000

  let attempts = 0
  let timer: ReturnType<typeof setTimeout> | null = null

  function schedule(callback: () => void): void {
    if (timer !== null) clearTimeout(timer)
    attempts += 1
    const delay = Math.min(baseMs * attempts, maxMs)
    timer = setTimeout(callback, delay)
  }

  function cancel(): void {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    attempts = 0
  }

  function reset(): void {
    attempts = 0
  }

  return { schedule, cancel, reset }
}
