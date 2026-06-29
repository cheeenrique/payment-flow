<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { getByToken, confirm, streamUrl } from '@/services/checkout.service'
import type { CheckoutView, PaymentMethod } from '@/types'
import { createReconnect } from '@/streams/reconnect'
import type { ReconnectHandle } from '@/streams/reconnect'
import { Button } from '@/components/ui/button'
import ChargeSummaryCard from '@/components/checkout/ChargeSummaryCard.vue'
import MethodSelector from '@/components/checkout/MethodSelector.vue'
import CheckoutStatus from '@/components/checkout/CheckoutStatus.vue'
import type { StatusState } from '@/components/checkout/CheckoutStatus.vue'
import CardFormFake from '@/components/checkout/CardFormFake.vue'
import PixArtifactFake from '@/components/checkout/PixArtifactFake.vue'
import BoletoArtifactFake from '@/components/checkout/BoletoArtifactFake.vue'

type CheckoutPageState =
  | 'loading'
  | 'awaiting'
  | 'processing'
  | 'approved'
  | 'failed'
  | 'expired'
  | 'unavailable'

const TERMINAL_STATES = new Set<CheckoutPageState>(['approved', 'failed', 'expired'])

const route = useRoute()
const token = route.params['token'] as string

const pageState = ref<CheckoutPageState>('loading')
const checkoutView = ref<CheckoutView | null>(null)
const selectedMethod = ref<string>('')
const errorMessage = ref<string | null>(null)
const submitting = ref(false)

let eventSource: EventSource | null = null
const reconnect: ReconnectHandle = createReconnect({ baseMs: 1_000, maxMs: 10_000 })

const isTerminal = computed(() => TERMINAL_STATES.has(pageState.value))
const terminalState = computed(() => pageState.value as StatusState)
const isApproved = computed(() => pageState.value === 'approved')

function handleSseEvent(eventType: string): void {
  switch (eventType) {
    case 'payment.processing':
      pageState.value = 'processing'
      if (checkoutView.value) {
        checkoutView.value = { ...checkoutView.value, status: 'awaiting_payment' }
      }
      break
    case 'payment.approved':
    case 'charge.paid':
      pageState.value = 'approved'
      if (checkoutView.value) {
        checkoutView.value = { ...checkoutView.value, status: 'paid' }
      }
      closeStream()
      break
    case 'payment.failed':
    case 'charge.failed':
      pageState.value = 'failed'
      if (checkoutView.value) {
        checkoutView.value = { ...checkoutView.value, status: 'failed' }
      }
      closeStream()
      break
    case 'charge.expired':
      pageState.value = 'expired'
      if (checkoutView.value) {
        checkoutView.value = { ...checkoutView.value, status: 'expired' }
      }
      closeStream()
      break
  }
}

function closeStream(): void {
  reconnect.cancel()
  eventSource?.close()
  eventSource = null
}

function openStream(): void {
  if (eventSource) return

  const url = streamUrl(token)
  eventSource = new EventSource(url)

  // Reseta o contador de tentativas ao reconectar com sucesso
  eventSource.onopen = (): void => {
    reconnect.reset()
  }

  eventSource.onmessage = (event: MessageEvent): void => {
    try {
      const data = JSON.parse(event.data as string) as { type: string }
      handleSseEvent(data.type)
    } catch {
      // mensagem malformada — ignora sem derrubar a conexão
    }
  }

  eventSource.onerror = (): void => {
    eventSource?.close()
    eventSource = null

    if (isTerminal.value) return

    reconnect.schedule(() => {
      openStream()
    })
  }
}

async function handleConfirm(): Promise<void> {
  if (!selectedMethod.value || submitting.value) return

  submitting.value = true
  errorMessage.value = null

  // Abre o stream antes do confirm para não perder o veredito SSE (race condition I5)
  openStream()

  try {
    await confirm(token, selectedMethod.value as PaymentMethod)
    pageState.value = 'processing'
  } catch (err) {
    // confirm falhou — fecha stream e mantém estado awaiting com mensagem
    closeStream()
    errorMessage.value =
      err instanceof Error ? err.message : 'Erro ao confirmar. Tente novamente.'
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    const view = await getByToken(token)
    checkoutView.value = view

    switch (view.status) {
      case 'pending':
        pageState.value = 'awaiting'
        break
      case 'awaiting_payment':
        // Cobrança já confirmada — aguarda veredito do PSP
        pageState.value = 'processing'
        openStream()
        break
      case 'paid':
        pageState.value = 'approved'
        break
      case 'failed':
        pageState.value = 'failed'
        break
      case 'expired':
        pageState.value = 'expired'
        break
      default:
        pageState.value = 'unavailable'
    }
  } catch {
    // 404 ou falha de rede — link inválido
    pageState.value = 'unavailable'
  }
})

onUnmounted(() => {
  closeStream()
})
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- Carregando -->
    <div v-if="pageState === 'loading'" class="text-center py-12 text-muted-foreground">
      <p class="text-sm">Carregando cobrança…</p>
    </div>

    <!-- Link inválido -->
    <div
      v-else-if="pageState === 'unavailable'"
      v-motion
      :initial="{ opacity: 0, y: 10 }"
      :enter="{ opacity: 1, y: 0, transition: { duration: 250 } }"
      class="text-center py-12"
    >
      <p class="text-lg font-semibold">Link inválido</p>
      <p class="text-sm text-muted-foreground mt-2">
        Este link de pagamento não existe ou foi cancelado.
      </p>
    </div>

    <!-- Fluxo principal -->
    <template v-else>

      <!-- Resumo da cobrança — visível em todos os estados (exceto loading/unavailable) -->
      <ChargeSummaryCard v-if="checkoutView" :view="checkoutView" />

      <!-- Estados terminais -->
      <template v-if="isTerminal">
        <CheckoutStatus :state="terminalState" />

        <!-- Artefato pós-pagamento quando aprovado -->
        <template v-if="isApproved">
          <PixArtifactFake v-if="selectedMethod === 'pix'" :approved="true" />
          <BoletoArtifactFake v-else-if="selectedMethod === 'boleto'" :approved="true" />
        </template>
      </template>

      <!-- Processando -->
      <CheckoutStatus v-else-if="pageState === 'processing'" state="processing" />

      <!-- Aguardando — seleção de método + confirmar -->
      <template v-else-if="pageState === 'awaiting' && checkoutView">
        <MethodSelector
          :methods="checkoutView.availableMethods"
          v-model="selectedMethod"
        />

        <!-- Artefato fake por método antes de confirmar -->
        <CardFormFake v-if="selectedMethod === 'credit_card'" />
        <PixArtifactFake v-else-if="selectedMethod === 'pix'" :approved="false" />
        <BoletoArtifactFake v-else-if="selectedMethod === 'boleto'" :approved="false" />

        <!-- Erro de confirmação -->
        <p v-if="errorMessage" class="text-sm text-destructive" role="alert">
          {{ errorMessage }}
        </p>

        <Button
          :disabled="!selectedMethod || submitting"
          class="w-full"
          @click="handleConfirm"
        >
          <span v-if="submitting">Processando…</span>
          <span v-else>Confirmar pagamento</span>
        </Button>
      </template>

    </template>
  </div>
</template>
