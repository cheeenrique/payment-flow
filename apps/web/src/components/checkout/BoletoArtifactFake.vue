<script setup lang="ts">
defineProps<{ approved: boolean }>()

const barcode = '34191.09008 61207.727308 71140.151205 1 99350000010000'
</script>

<template>
  <div class="flex flex-col gap-4 py-2">
    <div
      class="w-full h-16 bg-muted border border-border rounded flex items-center justify-center"
    >
      <span class="text-xs text-muted-foreground">Código de barras (simulação)</span>
    </div>
    <div>
      <p class="text-xs font-medium text-muted-foreground mb-1">Linha digitável</p>
      <code class="block text-sm bg-muted rounded p-3 break-all tracking-wide">{{ barcode }}</code>
    </div>
    <p v-if="approved" class="text-sm font-medium text-green-700">Boleto compensado!</p>
    <p v-else class="text-xs text-muted-foreground">
      Prazo de compensação: até 3 dias úteis (simulação).
    </p>
  </div>
</template>
