<script setup lang="ts">
defineProps<{ approved: boolean }>()

const fakeKey = '00020126580014BR.GOV.BCB.PIX0136fake-pix-key-checkout-demo520400005303986'
</script>

<template>
  <div class="flex flex-col items-center gap-4 py-4">
    <div
      class="w-48 h-48 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center"
    >
      <span class="text-xs text-muted-foreground text-center px-4">
        QR Code PIX<br />(simulação)
      </span>
    </div>
    <div class="w-full">
      <p class="text-xs font-medium text-muted-foreground mb-1">Chave PIX (copia e cola)</p>
      <code class="block text-xs bg-muted rounded p-2 break-all">{{ fakeKey }}</code>
    </div>
    <p v-if="approved" class="text-sm font-medium text-green-700">PIX recebido com sucesso!</p>
    <p v-else class="text-sm text-muted-foreground">Aguardando confirmação do PIX…</p>
  </div>
</template>
