<script setup lang="ts">
import { computed } from 'vue'
import { useInvoicesStore } from '@/stores/invoices.store'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatDateTime } from '@/utils/format'

const store = useInvoicesStore()

/** Fatura mais recente da lista (ordenada por createdAt desc) */
const latest = computed(() => {
  if (store.list.length === 0) return null

  return [...store.list].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )[0]
})
</script>

<template>
  <div class="rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs px-6 py-5 flex flex-col gap-3">
    <p class="text-sm font-medium text-muted-foreground">Última Fatura</p>

    <!-- Estado vazio -->
    <p v-if="!latest" class="text-sm text-muted-foreground">
      Nenhuma fatura registrada.
    </p>

    <!-- Dados da fatura mais recente -->
    <template v-else>
      <div class="flex items-center gap-2">
        <StatusBadge :status="latest.status" />
      </div>

      <dl class="flex flex-col gap-1 text-sm">
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Referência</dt>
          <dd class="font-medium font-mono text-xs">
            {{ latest.externalReference ?? '—' }}
          </dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Pagamento</dt>
          <dd class="font-mono text-xs">{{ latest.paymentId.slice(0, 8) }}</dd>
        </div>
        <div v-if="latest.issuedAt" class="flex justify-between">
          <dt class="text-muted-foreground">Emitida em</dt>
          <dd class="font-medium">{{ formatDateTime(latest.issuedAt) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-muted-foreground">Criada em</dt>
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
