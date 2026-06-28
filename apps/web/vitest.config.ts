import path from 'path';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  test: {
    // Simula o DOM do navegador para testes de componentes Vue
    environment: 'jsdom',
    globals: true,
  },
  resolve: {
    // Mantém o alias @/ consistente com vite.config.ts
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
