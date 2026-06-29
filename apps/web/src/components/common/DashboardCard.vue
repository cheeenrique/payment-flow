<script setup lang="ts">
// Cartão reutilizável para painéis do dashboard
// O valor é passado via slot para permitir qualquer formatação
defineProps<{
  title: string
}>()
</script>

<template>
  <div class="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs px-6 py-5 flex flex-col gap-2">
    <p class="text-sm font-medium text-muted-foreground">{{ title }}</p>
    <div class="text-2xl font-semibold">
      <!-- Conteúdo do valor: número, gráfico ou qualquer elemento -->
      <slot />
    </div>
  </div>
</template>
