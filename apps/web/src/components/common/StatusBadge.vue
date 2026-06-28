<script setup lang="ts">
import { computed } from 'vue'

// Mapeamento de status para grupo de cor
const STATUS_GREEN = ['paid', 'approved', 'issued'] as const
const STATUS_YELLOW = ['pending', 'processing', 'requested', 'awaiting_payment'] as const
const STATUS_RED = ['failed', 'expired', 'canceled'] as const

const props = defineProps<{
  status: string
}>()

// Retorna as classes Tailwind correspondentes ao status recebido
const colorClasses = computed(() => {
  if ((STATUS_GREEN as readonly string[]).includes(props.status)) {
    return 'bg-green-100 text-green-800'
  }
  if ((STATUS_YELLOW as readonly string[]).includes(props.status)) {
    return 'bg-yellow-100 text-yellow-800'
  }
  if ((STATUS_RED as readonly string[]).includes(props.status)) {
    return 'bg-red-100 text-red-800'
  }
  // Status desconhecido → cinza neutro
  return 'bg-gray-100 text-gray-600'
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize',
      colorClasses,
    ]"
  >
    {{ status }}
  </span>
</template>
