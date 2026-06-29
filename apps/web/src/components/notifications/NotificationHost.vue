<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notifications.store'
import NotificationToast from './NotificationToast.vue'
import type { Notification } from '@/types'

const DISMISS_TIMEOUT_MS = 5_000

const store = useNotificationsStore()
const activeToasts = ref<Notification[]>([])
const seenIds = new Set<string>()

/** Seed seenIds on mount so already-loaded historical items never toast */
onMounted(() => {
  for (const n of store.list) seenIds.add(n.id)
})

watch(
  () => store.list,
  (list) => {
    for (const notification of list) {
      if (seenIds.has(notification.id)) continue
      seenIds.add(notification.id)
      activeToasts.value.unshift(notification)
      const id = notification.id
      setTimeout(() => dismiss(id), DISMISS_TIMEOUT_MS)
    }
  },
  { deep: true },
)

function dismiss(id: string): void {
  activeToasts.value = activeToasts.value.filter((t) => t.id !== id)
}
</script>

<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      class="fixed bottom-4 right-4 z-50 flex flex-col gap-3 items-end"
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-8"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-8"
      move-class="transition-all duration-200"
      aria-live="polite"
      aria-label="Notificações"
    >
      <NotificationToast
        v-for="toast in activeToasts"
        :key="toast.id"
        :notification="toast"
        @dismiss="dismiss"
      />
    </TransitionGroup>
  </Teleport>
</template>
