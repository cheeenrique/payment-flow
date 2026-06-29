<script setup lang="ts">
import { CreditCard, QrCode, FileText } from '@lucide/vue'

defineProps<{
  methods: string[]
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [method: string]
}>()

type MethodConfig = { label: string; icon: typeof CreditCard; id: string }

const METHOD_CONFIG: Record<string, MethodConfig> = {
  pix: { id: 'pix', label: 'PIX', icon: QrCode },
  boleto: { id: 'boleto', label: 'Boleto', icon: FileText },
  credit_card: { id: 'credit_card', label: 'Cartão de Crédito', icon: CreditCard },
}

function select(method: string): void {
  emit('update:modelValue', method)
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <p class="text-sm font-medium text-muted-foreground">Escolha o método de pagamento</p>
    <div
      v-for="methodId in methods"
      :key="methodId"
      :data-method-id="methodId"
      class="flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-colors"
      :class="modelValue === methodId ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'"
      @click="select(methodId)"
    >
      <component
        :is="METHOD_CONFIG[methodId]?.icon ?? CreditCard"
        class="h-5 w-5 shrink-0"
        :class="modelValue === methodId ? 'text-primary' : 'text-muted-foreground'"
      />
      <span class="text-sm font-medium">
        {{ METHOD_CONFIG[methodId]?.label ?? methodId }}
      </span>
    </div>
  </div>
</template>
