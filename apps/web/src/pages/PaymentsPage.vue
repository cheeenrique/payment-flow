<script setup lang="ts">
import PaymentsList from '@/components/payments/PaymentsList.vue'
import PaymentStatusCard from '@/components/payments/PaymentStatusCard.vue'
</script>

<template>
  <div class="flex flex-col gap-4">
    <div>
      <h1 class="text-2xl font-semibold">Pagamentos</h1>
      <p class="text-muted-foreground text-sm">Acompanhe os pagamentos das cobranças.</p>
    </div>

    <PaymentStatusCard />

    <PaymentsList />
  </div>
</template>
