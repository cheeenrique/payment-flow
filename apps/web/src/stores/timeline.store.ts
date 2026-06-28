import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { TimelineEvent } from '@/types'

export const useTimelineStore = defineStore('timeline', () => {
  // Lista reativa de eventos — mais recentes primeiro
  const list = ref<TimelineEvent[]>([])

  /**
   * Substitui toda a lista por um novo conjunto de eventos de timeline.
   * Útil para carregamento inicial via REST (em ordem decrescente de data).
   */
  function set(items: TimelineEvent[]): void {
    list.value = items
  }

  /**
   * Adiciona evento no início da lista (mais recente primeiro).
   * Chamado ao receber eventos SSE de timeline em tempo real.
   */
  function prepend(item: TimelineEvent): void {
    list.value.unshift(item)
  }

  return { list, set, prepend }
})
