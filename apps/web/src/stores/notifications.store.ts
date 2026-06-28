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
   * Adiciona notificação no início da lista (mais recente primeiro).
   * Chamado ao receber evento SSE `notification.created`.
   */
  function prepend(item: Notification): void {
    list.value.unshift(item)
  }

  return { list, set, prepend }
})
