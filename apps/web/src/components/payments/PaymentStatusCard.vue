<script setup lang="ts">
import { computed } from 'vue'
import { usePaymentsStore } from '@/stores/payments.store'
import StatusBadge from '@/components/common/StatusBadge.vue'

const store = usePaymentsStore()

/** Pagamento mais recente da lista (ordenado por createdAt desc) */
const latest = computed(() => {
  if (store.list.length === 0) return null

  return [...store.list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]
})

/** Formata string ISO 8601 para data e hora no formato local pt-BR */
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}
</script>

<template>
  <div class="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs px-6 py-5 flex flex-col gap-3">
    <p class="text-sm font-medium text-muted-foreground">Último Pagamento</p>

    <!-- Estado vazio -->
    <p v-if="!latest" class="text-sm text-muted-foreground">
      Nenhum pagamento registrado.
    </p>

    <!-- Dados do pagamento mais recente -->
    <template v-else>
      <div class="flex items-center gap-2">
        <StatusBadge :status="latest.status" />
      </div>

      <dl class="flex flex-col gap-1 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Método</dt>
          <dd class="font-medium capitalize">{{ latest.method }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Data</dt>
          <dd class="font-medium">{{ formatDateTime(latest.createdAt) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">ID</dt>
          <dd class="font-mono text-xs">{{ latest.id.slice(0, 8) }}</dd>
        </div>
      </dl>
    </template>
  </div>
</template>
