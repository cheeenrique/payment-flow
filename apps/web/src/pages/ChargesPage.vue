<script setup lang="ts">
import { onMounted } from 'vue'
import { useChargesStore } from '@/stores/charges.store'
import { list } from '@/services/charges.service'
import ChargesTable from '@/components/charges/ChargesTable.vue'
import CreateChargeDialog from '@/components/charges/CreateChargeDialog.vue'

const store = useChargesStore()

// Carrega a primeira página ao montar o componente
onMounted(async () => {
  try {
    const { items } = await list(1, 50)
    store.set(items)
  } catch (err) {
    console.error('[ChargesPage] falha ao carregar cobranças:', err)
  }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold">Cobranças</h1>
        <p class="text-muted-foreground text-sm">Gerencie suas cobranças.</p>
      </div>
      <CreateChargeDialog />
    </div>

    <ChargesTable />
  </div>
</template>
