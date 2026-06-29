<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Copy, Check } from '@lucide/vue'
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

// Link de pagamento gerado após criação bem-sucedida
const paymentLink = ref<string | null>(null)

// Feedback visual do botão de copiar
const copied = ref(false)

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
  paymentLink.value = null
  copied.value = false
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

    if (newCharge.paymentLinkToken) {
      paymentLink.value = `${window.location.origin}/pay/${newCharge.paymentLinkToken}`
    } else {
      open.value = false
      resetForm()
    }
  } catch (err) {
    // Exibe mensagem de erro amigável sem perder o contexto do campo
    error.value = err instanceof Error ? err.message : 'Erro ao criar cobrança. Tente novamente.'
    console.error('[CreateChargeDialog] falha ao criar cobrança:', err)
  } finally {
    submitting.value = false
  }
}

/** Copia o link de pagamento para a área de transferência */
async function copyLink(): Promise<void> {
  if (!paymentLink.value) return

  try {
    await navigator.clipboard.writeText(paymentLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // fallback silencioso — browser sem permissão de clipboard
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
        <DialogTitle>{{ paymentLink ? 'Cobrança Criada' : 'Nova Cobrança' }}</DialogTitle>
      </DialogHeader>

      <!-- Etapa de sucesso: exibe link copiável -->
      <template v-if="paymentLink">
        <p class="text-sm text-muted-foreground">
          Compartilhe o link abaixo com o cliente para realizar o pagamento.
        </p>

        <div class="flex items-center gap-2 rounded-md border bg-muted p-3">
          <span class="flex-1 truncate text-sm font-mono" :title="paymentLink">
            {{ paymentLink }}
          </span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            class="shrink-0"
            :aria-label="copied ? 'Link copiado' : 'Copiar link'"
            @click="copyLink"
          >
            <Check v-if="copied" class="h-4 w-4 text-green-600" />
            <Copy v-else class="h-4 w-4" />
            <span class="ml-1.5">{{ copied ? 'Copiado!' : 'Copiar' }}</span>
          </Button>
        </div>

        <DialogFooter>
          <Button type="button" @click="close">Fechar</Button>
        </DialogFooter>
      </template>

      <!-- Etapa do formulário -->
      <template v-else>
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
      </template>
    </DialogContent>
  </Dialog>
</template>
