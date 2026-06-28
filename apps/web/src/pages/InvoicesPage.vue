<script setup lang="ts">
import InvoiceCard from '@/components/invoices/InvoiceCard.vue'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-2xl font-semibold">Faturas</h1>
      <p class="text-muted-foreground text-sm">Acompanhe as faturas emitidas para os pagamentos.</p>
    </div>

    <InvoiceCard />
  </div>
</template>
