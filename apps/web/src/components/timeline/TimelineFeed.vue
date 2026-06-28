<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTimelineStore } from '@/stores/timeline.store'
import { fetchTimelinePage } from '@/services/timeline.service'
import type { TimelineEvent } from '@/types'
import { formatDateTime } from '@/utils/format'

const PAGE_LIMIT = 20

const store = useTimelineStore()
const loading = ref(false)
const error = ref<string | null>(null)
const grouped = ref(false)

/** Items sorted newest-first by timestamp */
const sortedItems = computed(() =>
  [...store.list].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  ),
)

interface EventGroup {
  correlationId: string
  items: TimelineEvent[]
}

/** Items grouped by correlationId, each group ordered newest-first */
const groupedItems = computed((): EventGroup[] => {
  const map = new Map<string, TimelineEvent[]>()
  for (const item of sortedItems.value) {
    if (!map.has(item.correlationId)) map.set(item.correlationId, [])
    map.get(item.correlationId)!.push(item)
  }
  return Array.from(map.entries()).map(([correlationId, items]) => ({
    correlationId,
    items,
  }))
})

const MOTION_INITIAL = { opacity: 0, y: -16 } as const
const MOTION_ENTER = { opacity: 1, y: 0, transition: { duration: 280 } } as const

onMounted(async () => {
  if (store.list.length > 0) return
  loading.value = true
  try {
    const page = await fetchTimelinePage(1, PAGE_LIMIT)
    store.set(page.items)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar timeline'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-semibold">Timeline de Eventos</h2>
      <button
        class="text-sm text-muted-foreground hover:text-foreground transition-colors"
        @click="grouped = !grouped"
      >
        {{ grouped ? 'Ver linear' : 'Agrupar por correlação' }}
      </button>
    </div>

    <!-- Loading -->
    <p v-if="loading" class="text-sm text-muted-foreground">Carregando...</p>

    <!-- Error -->
    <p v-else-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- Empty -->
    <p v-else-if="store.list.length === 0" class="text-sm text-muted-foreground">
      Nenhum evento registrado.
    </p>

    <!-- Flat list — ordered by timestamp desc -->
    <template v-else-if="!grouped">
      <div
        v-for="item in sortedItems"
        :key="item.id"
        v-motion
        :initial="MOTION_INITIAL"
        :enter="MOTION_ENTER"
        class="rounded-lg border bg-card text-card-foreground p-3 text-sm"
      >
        <div class="flex items-start justify-between gap-2">
          <span class="font-mono text-xs font-medium">{{ item.eventType }}</span>
          <span class="text-muted-foreground text-xs shrink-0">
            {{ formatDateTime(item.timestamp) }}
          </span>
        </div>
        <div class="mt-1 text-muted-foreground text-xs space-y-0.5">
          <div>
            <span class="font-medium">Agregado:</span>
            {{ item.aggregateType }} / {{ item.aggregateId.slice(0, 8) }}
          </div>
          <div>
            <span class="font-medium">Correlação:</span>
            {{ item.correlationId.slice(0, 8) }}
          </div>
        </div>
      </div>
    </template>

    <!-- Grouped list — one card per correlationId -->
    <template v-else>
      <div
        v-for="group in groupedItems"
        :key="group.correlationId"
        v-motion
        :initial="MOTION_INITIAL"
        :enter="MOTION_ENTER"
        class="rounded-lg border bg-card text-card-foreground overflow-hidden"
      >
        <!-- Group header -->
        <div
          class="px-3 py-2 bg-muted text-xs font-medium text-muted-foreground flex items-center justify-between"
        >
          <span>Correlação: {{ group.correlationId.slice(0, 8) }}</span>
          <span>{{ group.items.length }} evento{{ group.items.length !== 1 ? 's' : '' }}</span>
        </div>

        <!-- Group items -->
        <div
          v-for="item in group.items"
          :key="item.id"
          class="px-3 py-2 text-sm border-t first:border-t-0"
        >
          <div class="flex items-start justify-between gap-2">
            <span class="font-mono text-xs font-medium">{{ item.eventType }}</span>
            <span class="text-muted-foreground text-xs shrink-0">
              {{ formatDateTime(item.timestamp) }}
            </span>
          </div>
          <div class="text-muted-foreground text-xs mt-0.5">
            {{ item.aggregateType }} / {{ item.aggregateId.slice(0, 8) }}
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
