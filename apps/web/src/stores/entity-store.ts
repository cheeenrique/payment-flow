import { ref, type Ref } from 'vue'
import { defineStore } from 'pinia'

/**
 * Fábrica de store Pinia para entidades com `id: string`.
 * Expõe: `list`, `set(items)`, `upsert(item)`.
 *
 * Uso:
 * ```ts
 * export const useChargesStore = createEntityStore<Charge>('charges')
 * ```
 */
export function createEntityStore<T extends { id: string }>(name: string) {
  return defineStore(name, () => {
    const list = ref([]) as Ref<T[]>

    /**
     * Substitui toda a lista. Útil para carregamento inicial via REST.
     */
    function set(items: T[]): void {
      list.value = items
    }

    /**
     * Insere item novo ou substitui existente pelo mesmo id.
     * Operação idempotente — segura para eventos SSE duplicados.
     */
    function upsert(item: T): void {
      const index = list.value.findIndex((e) => e.id === item.id)
      if (index >= 0) {
        list.value[index] = { ...list.value[index], ...item }
      } else {
        list.value.push(item)
      }
    }

    return { list, set, upsert }
  })
}
