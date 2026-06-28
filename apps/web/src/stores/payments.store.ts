import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Payment } from '@/types'

export const usePaymentsStore = defineStore('payments', () => {
  // Lista reativa de pagamentos carregados na sessão
  const list = ref<Payment[]>([])

  /**
   * Substitui toda a lista por um novo conjunto de pagamentos.
   * Útil para carregamento inicial via REST.
   */
  function set(items: Payment[]): void {
    list.value = items
  }

  /**
   * Insere pagamento novo ou substitui existente pelo mesmo id.
   * Operação idempotente — segura para receber múltiplos eventos duplicados.
   */
  function upsert(item: Payment): void {
    const index = list.value.findIndex(p => p.id === item.id)
    if (index >= 0) {
      list.value[index] = item
    } else {
      list.value.push(item)
    }
  }

  return { list, set, upsert }
})
