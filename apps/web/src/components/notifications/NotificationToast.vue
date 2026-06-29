<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleX, TriangleAlert, Info, X } from '@lucide/vue'
import type { Notification, NotificationType } from '@/types'

const props = defineProps<{
  notification: Notification
}>()

const emit = defineEmits<{
  dismiss: [id: string]
}>()

type IconComponent = typeof CircleCheck

const ICON_MAP: Record<NotificationType, IconComponent> = {
  success: CircleCheck,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
}

const CARD_CLASS_MAP: Record<NotificationType, string> = {
  success: 'bg-green-50 border-green-200 text-green-900',
  error: 'bg-red-50 border-red-200 text-red-900',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-900',
  info: 'bg-blue-50 border-blue-200 text-blue-900',
}

const ICON_CLASS_MAP: Record<NotificationType, string> = {
  success: 'text-green-600',
  error: 'text-red-600',
  warning: 'text-yellow-600',
  info: 'text-blue-600',
}

const icon = computed(() => ICON_MAP[props.notification.type] ?? Info)
const cardClass = computed(() => CARD_CLASS_MAP[props.notification.type] ?? CARD_CLASS_MAP.info)
const iconClass = computed(() => ICON_CLASS_MAP[props.notification.type] ?? ICON_CLASS_MAP.info)

function handleDismiss(): void {
  emit('dismiss', props.notification.id)
}
</script>

<template>
  <div
    :class="['flex items-start gap-3 w-80 rounded-lg border p-4 shadow-md', cardClass]"
    role="alert"
  >
    <component :is="icon" :class="['h-5 w-5 shrink-0 mt-0.5', iconClass]" aria-hidden="true" />

    <div class="flex-1 min-w-0">
      <p v-if="notification.title" class="text-sm font-semibold leading-none mb-1">
        {{ notification.title }}
      </p>
      <p class="text-sm leading-snug break-words">{{ notification.message }}</p>
    </div>

    <button
      class="shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
      aria-label="Fechar notificação"
      @click="handleDismiss"
    >
      <X class="h-4 w-4" />
    </button>
  </div>
</template>
