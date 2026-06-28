<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useChargesStore } from '@/stores/charges.store'
import { create } from '@/services/charges.service'
import type { CreateChargeDto } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const store = useChargesStore()

// Controla abertura/fechamento do dialog
const open = ref(false)

// Estado de envio em andamento
const submitting = ref(false)

// Mensagem de erro exibida quando a criação falha
const error = ref<string | null>(null)

// Valores do formulário com tipos explícitos
const form = reactive<CreateChargeDto>({
  customerId: '',
  amount: 0,
  paymentMethod: '',
  description: '',
  expiresAt: '',
})

/** Reseta os campos do formulário para o estado inicial */
function resetForm(): void {
  form.customerId = ''
  form.amount = 0
  form.paymentMethod = ''
  form.description = ''
  form.expiresAt = ''
  error.value = null
}

/** Submete o formulário, cria a cobrança e atualiza a store */
async function submit(): Promise<void> {
  error.value = null
  submitting.value = true

  // Monta DTO omitindo campos opcionais vazios
  const dto: CreateChargeDto = {
    customerId: form.customerId,
    amount: form.amount,
    paymentMethod: form.paymentMethod,
  }

  if (form.description) dto.description = form.description
  if (form.expiresAt) dto.expiresAt = form.expiresAt

  try {
    const newCharge = await create(dto)
    store.upsert(newCharge)
    open.value = false
    resetForm()
  } catch (err) {
    // Exibe mensagem de erro amigável sem perder o contexto do campo
    error.value = err instanceof Error ? err.message : 'Erro ao criar cobrança. Tente novamente.'
    console.error('[CreateChargeDialog] falha ao criar cobrança:', err)
  } finally {
    submitting.value = false
  }
}

/** Fecha o dialog e descarta as alterações não salvas */
function close(): void {
  open.value = false
  resetForm()
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => { if (!v) close() }">
    <DialogTrigger as-child>
      <Button @click="open = true">Nova Cobrança</Button>
    </DialogTrigger>

    <DialogContent :show-close-button="false">
      <DialogHeader>
        <DialogTitle>Nova Cobrança</DialogTitle>
      </DialogHeader>

      <form class="grid gap-4" @submit.prevent="submit">
        <!-- ID do cliente -->
        <div class="grid gap-1.5">
          <label for="customerId" class="text-sm font-medium">Cliente (ID)</label>
          <Input
            id="customerId"
            v-model="form.customerId"
            type="text"
            placeholder="cust_abc123"
            required
          />
        </div>

        <!-- Valor em centavos -->
        <div class="grid gap-1.5">
          <label for="amount" class="text-sm font-medium">Valor (centavos)</label>
          <Input
            id="amount"
            v-model.number="form.amount"
            type="number"
            min="1"
            placeholder="10000"
            required
          />
        </div>

        <!-- Método de pagamento -->
        <div class="grid gap-1.5">
          <label for="paymentMethod" class="text-sm font-medium">Método de Pagamento</label>
          <Input
            id="paymentMethod"
            v-model="form.paymentMethod"
            type="text"
            placeholder="pix, boleto, cartão..."
            required
          />
        </div>

        <!-- Descrição (opcional) -->
        <div class="grid gap-1.5">
          <label for="description" class="text-sm font-medium">
            Descrição <span class="text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="description"
            v-model="form.description"
            type="text"
            placeholder="Cobrança referente a..."
          />
        </div>

        <!-- Expiração (opcional) -->
        <div class="grid gap-1.5">
          <label for="expiresAt" class="text-sm font-medium">
            Expira em <span class="text-muted-foreground">(opcional)</span>
          </label>
          <Input
            id="expiresAt"
            v-model="form.expiresAt"
            type="datetime-local"
          />
        </div>

        <!-- Mensagem de erro inline -->
        <p v-if="error" class="text-sm text-destructive" role="alert">{{ error }}</p>

        <DialogFooter>
          <Button type="button" variant="outline" :disabled="submitting" @click="close">
            Cancelar
          </Button>
          <Button type="submit" :disabled="submitting">
            <span v-if="submitting">Criando...</span>
            <span v-else>Criar Cobrança</span>
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
