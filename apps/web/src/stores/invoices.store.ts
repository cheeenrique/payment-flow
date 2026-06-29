import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Invoice } from '@/types'

export const useInvoicesStore = defineStore('invoices', () => {
  // Lista reativa de faturas carregadas na sessão
  const list = ref<Invoice[]>([])

  /**
   * Substitui toda a lista por um novo conjunto de faturas.
   * Útil para carregamento inicial via REST.
   */
  function set(items: Invoice[]): void {
    list.value = items
  }

  /**
   * Insere fatura nova ou substitui existente pelo mesmo id.
   * Operação idempotente — segura para receber múltiplos eventos duplicados.
   */
  function upsert(item: Invoice): void {
    const index = list.value.findIndex(i => i.id === item.id)
    if (index >= 0) {
      list.value[index] = { ...list.value[index], ...item }
    } else {
      list.value.push(item)
    }
  }

  return { list, set, upsert }
})
