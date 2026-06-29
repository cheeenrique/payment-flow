import type { Payment } from '@/types'
import { createEntityStore } from '@/stores/entity-store'

export const usePaymentsStore = createEntityStore<Payment>('payments')
