<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import Card from '@/components/ui/card/Card.vue'
import CardContent from '@/components/ui/card/CardContent.vue'
import CardHeader from '@/components/ui/card/CardHeader.vue'
import CardTitle from '@/components/ui/card/CardTitle.vue'
import Input from '@/components/ui/input/Input.vue'
import Button from '@/components/ui/button/Button.vue'

const router = useRouter()
const authStore = useAuthStore()

// Campos do formulário de login
const email = ref('')
const senha = ref('')
const mensagemErro = ref<string | null>(null)
const carregando = ref(false)

/**
 * Envia as credenciais e redireciona para a home em caso de sucesso.
 * Em caso de falha, exibe mensagem de erro sem limpar os campos.
 */
async function handleSubmit(): Promise<void> {
  mensagemErro.value = null
  carregando.value = true

  try {
    await authStore.login(email.value, senha.value)
    await router.push('/')
  } catch {
    // Mantém os campos preenchidos para o usuário corrigir apenas o erro
    mensagemErro.value = 'E-mail ou senha inválidos. Tente novamente.'
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>

      <CardContent>
        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <!-- Campo de e-mail -->
          <div class="flex flex-col gap-1.5">
            <label for="email" class="text-sm font-medium leading-none">
              E-mail
            </label>
            <Input
              id="email"
              v-model="email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
              required
            />
          </div>

          <!-- Campo de senha -->
          <div class="flex flex-col gap-1.5">
            <label for="senha" class="text-sm font-medium leading-none">
              Senha
            </label>
            <Input
              id="senha"
              v-model="senha"
              type="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
          </div>

          <!-- Mensagem de erro inline — exibida somente quando há falha -->
          <p v-if="mensagemErro" role="alert" class="text-sm text-destructive">
            {{ mensagemErro }}
          </p>

          <Button type="submit" :disabled="carregando" class="w-full">
            {{ carregando ? 'Entrando...' : 'Entrar' }}
          </Button>
        </form>
      </CardContent>
    </Card>
  </div>
</template>
