import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Charge } from '@/types'

export const useChargesStore = defineStore('charges', () => {
  // Lista reativa de cobranças carregadas na sessão
  const list = ref<Charge[]>([])

  /**
   * Substitui toda a lista por um novo conjunto de cobranças.
   * Útil para carregamento inicial via REST.
   */
  function set(items: Charge[]): void {
    list.value = items
  }

  /**
   * Insere cobrança nova ou substitui existente pelo mesmo id.
   * Operação idempotente — segura para receber múltiplos eventos duplicados.
   */
  function upsert(item: Charge): void {
    const index = list.value.findIndex(c => c.id === item.id)
    if (index >= 0) {
      list.value[index] = { ...list.value[index], ...item }
    } else {
      list.value.push(item)
    }
  }

  return { list, set, upsert }
})
