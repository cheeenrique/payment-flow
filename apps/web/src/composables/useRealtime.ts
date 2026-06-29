import { ref, onMounted, onUnmounted } from 'vue'
import { apolloClient } from '@/services/apollo'
import { DASHBOARD_SUMMARY } from '@/graphql/dashboard.query'
import { fetchTimelinePage } from '@/services/timeline.service'
import { createEventStream } from '@/streams/sse'
import type { EventStreamHandle } from '@/streams/sse'
import type { SseEvent } from '@/streams/dispatcher'
import { registerSseHandlers } from '@/stores/sse-handlers'
import { useAuthStore } from '@/stores/auth.store'
import { useTimelineStore } from '@/stores/timeline.store'
import { useChargesStore } from '@/stores/charges.store'
import { list as listCharges } from '@/services/charges.service'
import type { TimelineEvent } from '@/types'

/** Contadores por status de cobrança */
export interface ChargesSummary {
  total: number
  pending: number
  awaitingPayment: number
  paid: number
  canceled: number
  expired: number
  failed: number
}

/** Contadores por status de pagamento */
export interface PaymentsSummary {
  total: number
  pending: number
  processing: number
  approved: number
  failed: number
  expired: number
}

/** Contadores por status de fatura */
export interface InvoicesSummary {
  total: number
  requested: number
  processing: number
  issued: number
  failed: number
}

/** Snapshot agregado retornado pela query DASHBOARD_SUMMARY */
export interface DashboardSummary {
  charges: ChargesSummary
  payments: PaymentsSummary
  invoices: InvoicesSummary
  approvalRate: number
}

interface DashboardQueryResult {
  dashboard: DashboardSummary
}

const TIMELINE_INITIAL_PAGE = 1
const TIMELINE_INITIAL_LIMIT = 20

/** Tipos de evento de domínio que geram entradas na timeline em tempo real */
const DOMAIN_EVENT_TYPES = new Set([
  'charge.created',
  'charge.updated',
  'payment.processing',
  'payment.approved',
  'payment.failed',
  'invoice.requested',
  'invoice.processing',
  'invoice.issued',
  'invoice.failed',
])

/**
 * Constrói uma entrada de TimelineEvent a partir de um evento SSE de domínio.
 * O `aggregateId` é lido do campo `id` do payload; o `aggregateType` é derivado
 * do prefixo do tipo de evento (ex: "charge.created" → "charge").
 */
function buildTimelineEntry(event: SseEvent): TimelineEvent {
  const payload = event.payload as Record<string, unknown>
  // chargeId/paymentId/invoiceId are the canonical id fields in domain events
  const chargeId = typeof payload?.['chargeId'] === 'string' ? payload['chargeId'] : undefined
  const payloadId = typeof payload?.['id'] === 'string' ? payload['id'] : undefined
  const aggregateId = chargeId ?? payloadId ?? ''
  const aggregateType = event.type.split('.')[0]

  return {
    id: crypto.randomUUID(),
    eventType: event.type,
    aggregateId,
    aggregateType,
    correlationId: event.correlationId,
    timestamp: event.timestamp,
  }
}

/**
 * Composable de orquestração do dashboard em tempo real.
 *
 * No `onMounted`:
 *   1. Busca DASHBOARD_SUMMARY via GraphQL e timeline inicial via REST em paralelo.
 *   2. Abre conexão SSE autenticada com handler composto:
 *      - eventos de entidade roteados para stores via `registerSseHandlers`
 *      - eventos de domínio também constroem entradas de timeline via interceptor
 *
 * No `onUnmounted`: fecha o handle SSE.
 *
 * Retorna: `{ summary, isLoading, error }`.
 */
export function useRealtime() {
  const authStore = useAuthStore()
  const timeline = useTimelineStore()
  const charges = useChargesStore()

  const summary = ref<DashboardSummary | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  let streamHandle: EventStreamHandle | null = null

  async function loadInitialData(): Promise<void> {
    isLoading.value = true
    error.value = null

    try {
      const [summaryResult, timelinePage, chargesPage] = await Promise.all([
        apolloClient.query<DashboardQueryResult>({
          query: DASHBOARD_SUMMARY,
          fetchPolicy: 'network-only',
        }),
        fetchTimelinePage(TIMELINE_INITIAL_PAGE, TIMELINE_INITIAL_LIMIT),
        listCharges(1, 50),
      ])

      if (summaryResult.data) {
        summary.value = summaryResult.data.dashboard
      }
      timeline.set(timelinePage.items)
      charges.set(chargesPage.items)
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : 'Erro ao carregar dados do dashboard'
    } finally {
      isLoading.value = false
    }
  }

  function openEventStream(): void {
    const token = authStore.accessToken
    if (!token) return

    const handlers = registerSseHandlers()

    streamHandle = createEventStream(token, handlers, (event: SseEvent) => {
      if (DOMAIN_EVENT_TYPES.has(event.type)) {
        timeline.prepend(buildTimelineEntry(event))
      }
    })
  }

  onMounted(async () => {
    await loadInitialData()
    openEventStream()
  })

  onUnmounted(() => {
    streamHandle?.close()
    streamHandle = null
  })

  return { summary, isLoading, error }
}
