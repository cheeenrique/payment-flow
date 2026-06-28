<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

// Token do link de pagamento — conteúdo real implementado na Fase 2
const token = route.params['token'] as string
</script>

<template>
  <div class="bg-card rounded-lg border p-6 shadow-sm">
    <h1 class="text-xl font-semibold mb-2">Pagamento</h1>
    <p class="text-muted-foreground text-sm">
      Token: <code class="font-mono text-xs">{{ token }}</code>
    </p>
    <p class="text-muted-foreground text-sm mt-1">Formulário de checkout em breve.</p>
  </div>
</template>
