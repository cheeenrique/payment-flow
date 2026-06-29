import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Notification } from '@/types'

export const useNotificationsStore = defineStore('notifications', () => {
  // Lista reativa de notificações — mais recentes primeiro
  const list = ref<Notification[]>([])

  /**
   * Substitui toda a lista por um novo conjunto de notificações.
   * Útil para carregamento inicial via REST.
   */
  function set(items: Notification[]): void {
    list.value = items
  }

  /**
   * Insere notificação nova ou substitui existente pelo mesmo id.
   * Operação idempotente — segura para receber múltiplos eventos duplicados.
   */
  function upsert(item: Notification): void {
    const index = list.value.findIndex(n => n.id === item.id)
    if (index >= 0) {
      list.value[index] = item
    } else {
      list.value.push(item)
    }
  }

  /**
   * Adiciona notificação no início da lista (mais recente primeiro).
   * Chamado ao receber evento SSE `notification.created`.
   */
  function prepend(item: Notification): void {
    list.value.unshift(item)
  }

  return { list, set, upsert, prepend }
})
