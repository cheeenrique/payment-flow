<script setup lang="ts">
import { computed } from 'vue'
import { Loader2, CheckCircle2, XCircle, Clock } from '@lucide/vue'

export type StatusState = 'processing' | 'approved' | 'failed' | 'expired'

const props = defineProps<{ state: StatusState }>()

type StateConfig = {
  icon: typeof Loader2
  title: string
  message: string
  wrapperClass: string
  iconClass: string
  spin: boolean
}

const CONFIG: Record<StatusState, StateConfig> = {
  processing: {
    icon: Loader2,
    title: 'Processando pagamento',
    message: 'Aguarde enquanto confirmamos seu pagamento…',
    wrapperClass: 'border-yellow-200 bg-yellow-50',
    iconClass: 'text-yellow-600',
    spin: true,
  },
  approved: {
    icon: CheckCircle2,
    title: 'Pagamento aprovado!',
    message: 'Seu pagamento foi confirmado com sucesso.',
    wrapperClass: 'border-green-200 bg-green-50',
    iconClass: 'text-green-600',
    spin: false,
  },
  failed: {
    icon: XCircle,
    title: 'Pagamento recusado',
    message: 'Não foi possível processar seu pagamento. Tente novamente.',
    wrapperClass: 'border-red-200 bg-red-50',
    iconClass: 'text-red-600',
    spin: false,
  },
  expired: {
    icon: Clock,
    title: 'Cobrança expirada',
    message: 'O prazo para pagamento foi encerrado.',
    wrapperClass: 'border-gray-200 bg-gray-50',
    iconClass: 'text-gray-500',
    spin: false,
  },
}

const config = computed(() => CONFIG[props.state])
</script>

<template>
  <div
    v-motion
    :initial="{ opacity: 0, scale: 0.95 }"
    :enter="{ opacity: 1, scale: 1, transition: { duration: 300 } }"
    :class="['rounded-xl border-2 p-8 text-center flex flex-col items-center gap-4', config.wrapperClass]"
  >
    <component
      :is="config.icon"
      :class="['h-12 w-12', config.iconClass, { 'animate-spin': config.spin }]"
    />
    <div>
      <h2 class="text-lg font-semibold">{{ config.title }}</h2>
      <p class="text-sm text-muted-foreground mt-1">{{ config.message }}</p>
    </div>
  </div>
</template>
