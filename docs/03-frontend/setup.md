# Frontend Setup (Vue 3)

## Visão Geral

Este documento define o setup inicial do frontend do Payment Flow.

Stack focada em:

- dashboard em tempo real
- arquitetura event-driven
- simplicidade e escalabilidade

---

# Stack final

## Core

- Vue 3
- Vite
- TypeScript

---

## UI

- TailwindCSS
- shadcn-vue
- lucide-vue-next

---

## State

- Pinia

---

## Comunicação

- REST (HTTP)
- SSE (EventSource)
- GraphQL (Apollo Client)

---

# 1. Criar projeto

```bash id="setup_cmd1"
npm create vite@latest web
```

Selecionar:

- Vue
- TypeScript

---

# 2. Entrar no projeto

```bash id="setup_cmd2"
cd web
npm install
```

---

# 3. Instalar dependências principais

## State management

```bash id="setup_cmd3"
npm install pinia
```

---

## HTTP client

```bash id="setup_cmd4"
npm install axios
```

---

## GraphQL

```bash id="setup_cmd5"
npm install @apollo/client graphql
```

---

## Icons

```bash id="setup_cmd6"
npm install lucide-vue-next
```

---

# 4. TailwindCSS

## Instalação

```bash id="setup_cmd7"
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

## Configuração

### tailwind.config.js

```js id="setup_tw1"
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,ts,js}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

---

## CSS base

### src/style.css

```css id="setup_css1"
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

# 5. shadcn-vue

## Inicialização

```bash id="setup_cmd8"
npx shadcn-vue@latest init
```

---

## Configuração sugerida

- framework: Vue
- style: default
- base color: neutral
- css: Tailwind

---

## Adicionar componentes base

```bash id="setup_cmd9"
npx shadcn-vue@latest add button card dialog table badge
```

---

# 6. Estrutura de pastas

```text id="setup_tree1"
src/
  components/
  pages/
  stores/
  services/
  streams/
  graphql/
  types/
  layouts/
```

---

# 7. Configuração do Pinia

## main.ts

```ts id="setup_pinia1"
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

const app = createApp(App);

app.use(createPinia());

app.mount('#app');
```

---

# 8. Configuração base do projeto

## main.ts completo

```ts id="setup_main1"
import { createApp } from 'vue';
import App from './App.vue';
import { createPinia } from 'pinia';
import './style.css';

const app = createApp(App);

app.use(createPinia());

app.mount('#app');
```

---

# 9. Configuração SSE base

## src/streams/sse.ts

```ts id="setup_sse1"
export function createEventStream() {
  const eventSource = new EventSource('/events/stream');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('SSE:', data);
  };

  return eventSource;
}
```

---

# 10. Alias (opcional recomendado)

## vite.config.ts

```ts id="setup_vite1"
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

---

# 11. Scripts úteis

```json id="setup_scripts1"
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview"
}
```

---

# Resultado final

Após setup você terá:

- Vue 3 pronto
- Tailwind funcionando
- shadcn-vue instalado
- SSE preparado
- Pinia configurado
- estrutura escalável