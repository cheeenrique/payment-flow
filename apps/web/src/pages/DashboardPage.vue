<script setup lang="ts">
import { useRealtime } from '@/composables/useRealtime'
import DashboardCard from '@/components/common/DashboardCard.vue'
import ChargesTable from '@/components/charges/ChargesTable.vue'
import PaymentsList from '@/components/payments/PaymentsList.vue'
import InvoiceCard from '@/components/invoices/InvoiceCard.vue'
import TimelineFeed from '@/components/timeline/TimelineFeed.vue'

const { summary, isLoading, error } = useRealtime()

/** Formata taxa de aprovação (0.0–1.0) como percentual */
function formatApprovalRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <!-- Cabeçalho -->
    <div>
      <h1 class="text-2xl font-semibold">Dashboard</h1>
      <p class="text-muted-foreground text-sm">Visão geral em tempo real.</p>
    </div>

    <!-- Erro de carregamento -->
    <p v-if="error" class="text-sm text-destructive">{{ error }}</p>

    <!-- Cards de resumo: cobranças, pagamentos, faturas, taxa de aprovação -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <DashboardCard title="Total de Cobranças">
        <span v-if="isLoading" class="text-muted-foreground text-lg">—</span>
        <span v-else>{{ summary?.charges.total ?? 0 }}</span>
      </DashboardCard>

      <DashboardCard title="Total de Pagamentos">
        <span v-if="isLoading" class="text-muted-foreground text-lg">—</span>
        <span v-else>{{ summary?.payments.total ?? 0 }}</span>
      </DashboardCard>

      <DashboardCard title="Total de Faturas">
        <span v-if="isLoading" class="text-muted-foreground text-lg">—</span>
        <span v-else>{{ summary?.invoices.total ?? 0 }}</span>
      </DashboardCard>

      <DashboardCard title="Taxa de Aprovação">
        <span v-if="isLoading" class="text-muted-foreground text-lg">—</span>
        <span v-else>{{ summary ? formatApprovalRate(summary.approvalRate) : '0%' }}</span>
      </DashboardCard>
    </div>

    <!-- Painel principal: tabela de cobranças + última fatura -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 flex flex-col gap-3">
        <h2 class="text-lg font-semibold">Cobranças</h2>
        <ChargesTable />
      </div>
      <div class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold">Faturas</h2>
        <InvoiceCard />
      </div>
    </div>

    <!-- Painel secundário: pagamentos + timeline de eventos -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold">Pagamentos</h2>
        <PaymentsList />
      </div>
      <div>
        <TimelineFeed />
      </div>
    </div>
  </div>
</template>
