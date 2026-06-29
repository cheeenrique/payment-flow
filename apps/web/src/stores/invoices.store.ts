import type { Invoice } from '@/types'
import { createEntityStore } from '@/stores/entity-store'

export const useInvoicesStore = createEntityStore<Invoice>('invoices')
