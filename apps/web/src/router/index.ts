import { createRouter, createWebHistory } from 'vue-router';

// Rotas base — cada feature adiciona as suas próprias no padrão lazy-import
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [],
});

export default router;
