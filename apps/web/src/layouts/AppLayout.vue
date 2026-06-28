<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import NotificationHost from '@/components/notifications/NotificationHost.vue'

const router = useRouter()
const authStore = useAuthStore()

// Links do menu lateral
const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/charges', label: 'Cobranças' },
  { to: '/payments', label: 'Pagamentos' },
  { to: '/invoices', label: 'Faturas' },
]

async function handleLogout(): Promise<void> {
  authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-background">
    <!-- Navbar superior -->
    <header class="h-14 border-b flex items-center px-6 justify-between shrink-0">
      <span class="font-semibold text-sm tracking-tight">payment-flow</span>

      <button
        class="text-sm text-muted-foreground hover:text-foreground transition-colors"
        @click="handleLogout"
      >
        Sair
      </button>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar de navegação -->
      <aside class="w-56 border-r flex flex-col gap-1 p-3 shrink-0">
        <nav>
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            active-class="bg-accent text-accent-foreground font-medium"
            exact-active-class="bg-accent text-accent-foreground font-medium"
          >
            {{ link.label }}
          </RouterLink>
        </nav>
      </aside>

      <!-- Conteúdo da página atual -->
      <main class="flex-1 overflow-auto p-6">
        <RouterView />
      </main>
    </div>

    <NotificationHost />
  </div>
</template>
