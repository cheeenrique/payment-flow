import { describe, it, expect, vi } from 'vitest'
import { dispatch } from '@/streams/dispatcher'
import type { SseEvent, EventHandlerMap } from '@/streams/dispatcher'

describe('dispatch', () => {
  it('chama o handler correto com o payload do evento', () => {
    // Arrange
    const handler = vi.fn()
    const handlers: EventHandlerMap = {
      'payment.approved': handler,
    }
    const event: SseEvent = {
      type: 'payment.approved',
      timestamp: '2026-06-28T00:00:00Z',
      correlationId: 'corr-123',
      payload: { orderId: 'ord-456', amount: 1000 },
    }

    // Act
    dispatch(event, handlers)

    // Assert
    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith(event.payload)
  })

  it('não chama nenhum handler para tipo desconhecido (no-op)', () => {
    // Arrange
    const handler = vi.fn()
    const handlers: EventHandlerMap = {
      'payment.approved': handler,
    }
    const unknownEvent: SseEvent = {
      type: 'tipo.inexistente',
      timestamp: '2026-06-28T00:00:00Z',
      correlationId: 'corr-999',
      payload: {},
    }

    // Act — não deve lançar erro
    expect(() => dispatch(unknownEvent, handlers)).not.toThrow()

    // Assert
    expect(handler).not.toHaveBeenCalled()
  })

  it('chama apenas o handler do tipo correspondente quando há múltiplos handlers', () => {
    // Arrange
    const approvedHandler = vi.fn()
    const failedHandler = vi.fn()
    const handlers: EventHandlerMap = {
      'payment.approved': approvedHandler,
      'payment.declined': failedHandler,
    }
    const event: SseEvent = {
      type: 'payment.declined',
      timestamp: '2026-06-28T00:00:00Z',
      correlationId: 'corr-777',
      payload: { reason: 'insufficient_funds' },
    }

    // Act
    dispatch(event, handlers)

    // Assert
    expect(failedHandler).toHaveBeenCalledOnce()
    expect(failedHandler).toHaveBeenCalledWith(event.payload)
    expect(approvedHandler).not.toHaveBeenCalled()
  })
})
