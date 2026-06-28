import type { EventHandlerMap } from '@/streams/dispatcher'
import type { Charge, Payment, Invoice, TimelineEvent, Notification } from '@/types'
import { useChargesStore } from '@/stores/charges.store'
import { usePaymentsStore } from '@/stores/payments.store'
import { useInvoicesStore } from '@/stores/invoices.store'
import { useTimelineStore } from '@/stores/timeline.store'
import { useNotificationsStore } from '@/stores/notifications.store'

/**
 * Registra handlers SSE mapeando tipos de evento para ações nos stores de domínio.
 * Deve ser chamado após o Pinia estar ativo (dentro de setup ou após createPinia).
 *
 * Mapa de roteamento:
 * - charge.created / charge.updated  → charges.upsert
 * - payment.processing / payment.approved / payment.failed → payments.upsert
 * - invoice.requested / invoice.processing / invoice.issued / invoice.failed → invoices.upsert
 * - notification.created → notifications.prepend
 * - timeline.event → timeline.prepend
 */
export function registerSseHandlers(): EventHandlerMap {
  const charges = useChargesStore()
  const payments = usePaymentsStore()
  const invoices = useInvoicesStore()
  const timeline = useTimelineStore()
  const notifications = useNotificationsStore()

  return {
    // Eventos de cobrança
    'charge.created': (payload: unknown) => charges.upsert(payload as Charge),
    'charge.updated': (payload: unknown) => charges.upsert(payload as Charge),

    // Eventos de pagamento
    'payment.processing': (payload: unknown) => payments.upsert(payload as Payment),
    'payment.approved': (payload: unknown) => payments.upsert(payload as Payment),
    'payment.failed': (payload: unknown) => payments.upsert(payload as Payment),

    // Eventos de fatura
    'invoice.requested': (payload: unknown) => invoices.upsert(payload as Invoice),
    'invoice.processing': (payload: unknown) => invoices.upsert(payload as Invoice),
    'invoice.issued': (payload: unknown) => invoices.upsert(payload as Invoice),
    'invoice.failed': (payload: unknown) => invoices.upsert(payload as Invoice),

    // Notificações
    'notification.created': (payload: unknown) => notifications.prepend(payload as Notification),

    // Eventos de timeline
    'timeline.event': (payload: unknown) => timeline.prepend(payload as TimelineEvent),
  }
}
