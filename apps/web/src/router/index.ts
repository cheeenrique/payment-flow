import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

// Lazy-imports — cada página carrega apenas quando acessada
const LoginPage = () => import('@/pages/LoginPage.vue')
const DashboardPage = () => import('@/pages/DashboardPage.vue')
const ChargesPage = () => import('@/pages/ChargesPage.vue')
const PaymentsPage = () => import('@/pages/PaymentsPage.vue')
const InvoicesPage = () => import('@/pages/InvoicesPage.vue')
const CheckoutPage = () => import('@/pages/CheckoutPage.vue')

// Layouts
const AppLayout = () => import('@/layouts/AppLayout.vue')
const CheckoutLayout = () => import('@/layouts/CheckoutLayout.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    // Rota pública — login
    {
      path: '/login',
      component: LoginPage,
      meta: { requiresAuth: false },
    },

    // Rotas autenticadas — envolvidas pelo AppLayout
    {
      path: '/',
      component: AppLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: DashboardPage,
        },
        {
          path: 'charges',
          name: 'charges',
          component: ChargesPage,
        },
        {
          path: 'payments',
          name: 'payments',
          component: PaymentsPage,
        },
        {
          path: 'invoices',
          name: 'invoices',
          component: InvoicesPage,
        },
      ],
    },

    // Rota pública de checkout — layout enxuto, page placeholder até Fase 2
    {
      path: '/pay/:token',
      component: CheckoutLayout,
      meta: { requiresAuth: false },
      children: [
        {
          path: '',
          name: 'checkout',
          component: CheckoutPage,
        },
      ],
    },
  ],
})

// Guard global: rotas com requiresAuth=true redirecionam para /login se não autenticado
router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login' }
  }
})

export default router
