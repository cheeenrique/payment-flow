<script setup lang="ts">
import { ref } from 'vue'
import { Input } from '@/components/ui/input'

const cardNumber = ref('')
const expiry = ref('')
const cvv = ref('')
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="grid gap-1.5">
      <label class="text-sm font-medium">Número do Cartão</label>
      <Input
        v-model="cardNumber"
        type="text"
        placeholder="0000 0000 0000 0000"
        maxlength="19"
      />
    </div>
    <div class="grid grid-cols-2 gap-4">
      <div class="grid gap-1.5">
        <label class="text-sm font-medium">Validade</label>
        <Input v-model="expiry" type="text" placeholder="MM/AA" maxlength="5" />
      </div>
      <div class="grid gap-1.5">
        <label class="text-sm font-medium">CVV</label>
        <Input v-model="cvv" type="text" placeholder="123" maxlength="4" />
      </div>
    </div>
    <p class="text-xs text-muted-foreground">Ambiente de simulação — dados não são processados.</p>
  </div>
</template>
