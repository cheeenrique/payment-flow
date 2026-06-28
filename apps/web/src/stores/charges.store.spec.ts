import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useChargesStore } from '@/stores/charges.store'
import type { Charge } from '@/types'

const chargeFactory = (overrides: Partial<Charge> = {}): Charge => ({
  id: 'charge-1',
  status: 'pending',
  amount: 10000,
  currency: 'BRL',
  customerId: 'customer-1',
  createdAt: '2026-06-28T00:00:00Z',
  updatedAt: '2026-06-28T00:00:00Z',
  ...overrides,
})

describe('charges.store', () => {
  beforeEach(() => {
    // Instância fresca do Pinia a cada teste para evitar vazamento de estado
    setActivePinia(createPinia())
  })

  describe('upsert', () => {
    it('adiciona nova cobrança quando id não existe na lista', () => {
      const store = useChargesStore()
      const charge = chargeFactory({ id: 'charge-novo' })

      store.upsert(charge)

      expect(store.list).toHaveLength(1)
      expect(store.list[0]).toEqual(charge)
    })

    it('substitui cobrança existente pelo mesmo id', () => {
      const store = useChargesStore()
      const original = chargeFactory({ id: 'charge-1', status: 'pending' })
      const atualizada = chargeFactory({ id: 'charge-1', status: 'paid' })

      store.upsert(original)
      store.upsert(atualizada)

      expect(store.list).toHaveLength(1)
      expect(store.list[0].status).toBe('paid')
    })

    it('mantém cobranças não afetadas ao atualizar uma existente', () => {
      const store = useChargesStore()
      const charge1 = chargeFactory({ id: 'charge-1' })
      const charge2 = chargeFactory({ id: 'charge-2' })
      const charge1Atualizada = chargeFactory({ id: 'charge-1', status: 'paid' })

      store.upsert(charge1)
      store.upsert(charge2)
      store.upsert(charge1Atualizada)

      expect(store.list).toHaveLength(2)
      expect(store.list.find(c => c.id === 'charge-2')).toEqual(charge2)
    })
  })

  describe('set', () => {
    it('substitui toda a lista por novos itens', () => {
      const store = useChargesStore()
      store.upsert(chargeFactory({ id: 'charge-antigo' }))

      const novaLista = [
        chargeFactory({ id: 'charge-a' }),
        chargeFactory({ id: 'charge-b' }),
      ]
      store.set(novaLista)

      expect(store.list).toHaveLength(2)
      expect(store.list[0].id).toBe('charge-a')
    })
  })
})
