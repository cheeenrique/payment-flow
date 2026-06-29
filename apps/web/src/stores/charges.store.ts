import type { Charge } from '@/types'
import { createEntityStore } from '@/stores/entity-store'

export const useChargesStore = createEntityStore<Charge>('charges')
