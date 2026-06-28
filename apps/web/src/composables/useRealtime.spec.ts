import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'

// Mocks must be hoisted before any imports that use these modules
vi.mock('@/services/apollo', () => ({
  apolloClient: {
    query: vi.fn(),
  },
}))

vi.mock('@/services/timeline.service', () => ({
  fetchTimelinePage: vi.fn(),
}))

vi.mock('@/streams/sse', () => ({
  createEventStream: vi.fn(),
}))

vi.mock('@/stores/sse-handlers', () => ({
  registerSseHandlers: vi.fn(),
}))

import { apolloClient } from '@/services/apollo'
import { fetchTimelinePage } from '@/services/timeline.service'
import { createEventStream } from '@/streams/sse'
import { registerSseHandlers } from '@/stores/sse-handlers'
import { useTimelineStore } from '@/stores/timeline.store'
import { useRealtime } from '@/composables/useRealtime'
import { DASHBOARD_SUMMARY } from '@/graphql/dashboard.query'
import type { DashboardSummary } from '@/composables/useRealtime'
import type { SseEvent } from '@/streams/dispatcher'
import type { TimelineEvent } from '@/types'

/** Helper: mount a minimal component so composable lifecycle hooks fire */
function withSetup<T>(composable: () => T) {
  let result!: T
  const TestComponent = defineComponent({
    setup() {
      result = composable()
      return {}
    },
    template: '<div />',
  })
  const wrapper = mount(TestComponent)
  return { result, wrapper }
}

const mockSummary: DashboardSummary = {
  charges: {
    total: 10,
    pending: 2,
    awaitingPayment: 1,
    paid: 5,
    canceled: 1,
    expired: 1,
    failed: 0,
  },
  payments: { total: 5, pending: 0, processing: 1, approved: 3, failed: 1, expired: 0 },
  invoices: { total: 3, requested: 0, processing: 1, issued: 2, failed: 0 },
  approvalRate: 0.75,
}

describe('useRealtime', () => {
  let mockClose: ReturnType<typeof vi.fn>
  let localStorageStore: Record<string, string> = {}

  const localStorageMock = {
    getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      localStorageStore[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete localStorageStore[key]
    }),
    clear: vi.fn(() => {
      localStorageStore = {}
    }),
  }

  beforeEach(() => {
    localStorageStore = { accessToken: 'test-token' }
    vi.stubGlobal('localStorage', localStorageMock)
    setActivePinia(createPinia())
    vi.clearAllMocks()

    mockClose = vi.fn()
    vi.mocked(createEventStream).mockReturnValue({ close: mockClose })
    vi.mocked(registerSseHandlers).mockReturnValue({})
    vi.mocked(apolloClient.query).mockResolvedValue({ data: { dashboard: mockSummary } })
    vi.mocked(fetchTimelinePage).mockResolvedValue({ total: 0, items: [] })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
  })

  it('busca DASHBOARD_SUMMARY via apolloClient ao montar', async () => {
    const { wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    expect(apolloClient.query).toHaveBeenCalledWith(
      expect.objectContaining({ query: DASHBOARD_SUMMARY }),
    )

    wrapper.unmount()
  })

  it('expõe summary preenchido após mount', async () => {
    const { result, wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    expect(result.summary.value).toEqual(mockSummary)

    wrapper.unmount()
  })

  it('busca timeline inicial e popula o store', async () => {
    const mockItems: TimelineEvent[] = [
      {
        id: 'ev-1',
        eventType: 'charge.created',
        aggregateId: 'charge-1',
        aggregateType: 'charge',
        correlationId: 'corr-1',
        timestamp: '2026-06-28T00:00:00Z',
      },
    ]
    vi.mocked(fetchTimelinePage).mockResolvedValue({ total: 1, items: mockItems })

    const { wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    const timelineStore = useTimelineStore()
    expect(timelineStore.list).toEqual(mockItems)

    wrapper.unmount()
  })

  it('abre stream SSE com o token de autenticação', async () => {
    const { wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    expect(createEventStream).toHaveBeenCalledWith(
      'test-token',
      expect.any(Object),
      expect.any(Function),
    )

    wrapper.unmount()
  })

  it('fecha o handle SSE ao desmontar', async () => {
    const { wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    wrapper.unmount()

    expect(mockClose).toHaveBeenCalledOnce()
  })

  it('eventos de domínio são adicionados à timeline via interceptor onRawEvent', async () => {
    let capturedInterceptor: ((event: SseEvent) => void) | undefined

    vi.mocked(createEventStream).mockImplementation((_token, _handlers, interceptor) => {
      capturedInterceptor = interceptor
      return { close: mockClose }
    })

    const { wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    const domainEvent: SseEvent = {
      type: 'charge.created',
      timestamp: '2026-06-28T12:00:00Z',
      correlationId: 'corr-abc',
      payload: { id: 'charge-1', status: 'pending' },
    }

    capturedInterceptor?.(domainEvent)

    const timelineStore = useTimelineStore()
    expect(timelineStore.list).toHaveLength(1)
    expect(timelineStore.list[0]).toMatchObject({
      eventType: 'charge.created',
      aggregateType: 'charge',
      aggregateId: 'charge-1',
      correlationId: 'corr-abc',
      timestamp: '2026-06-28T12:00:00Z',
    })

    wrapper.unmount()
  })

  it('eventos não-domínio não geram entradas na timeline', async () => {
    let capturedInterceptor: ((event: SseEvent) => void) | undefined

    vi.mocked(createEventStream).mockImplementation((_token, _handlers, interceptor) => {
      capturedInterceptor = interceptor
      return { close: mockClose }
    })

    const { wrapper } = withSetup(() => useRealtime())
    await flushPromises()

    const notificationEvent: SseEvent = {
      type: 'notification.created',
      timestamp: '2026-06-28T12:00:00Z',
      correlationId: 'corr-notif',
      payload: { id: 'notif-1', message: 'teste' },
    }

    capturedInterceptor?.(notificationEvent)

    const timelineStore = useTimelineStore()
    // items[] foi mockado como [], notificação não deve adicionar entrada
    expect(timelineStore.list).toHaveLength(0)

    wrapper.unmount()
  })
})
