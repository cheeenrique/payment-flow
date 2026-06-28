# Frontend Stack

## Visão Geral

Este documento define a stack tecnológica do frontend do Payment Flow.

O objetivo é escolher ferramentas que suportem:

- tempo real (SSE)
- dashboard complexo
- estado reativo
- escalabilidade futura
- baixa complexidade de manutenção

---

# Recomendação principal

## 👉 Vue 3 + TypeScript

---

# Por que Vue 3?

## 1. Simplicidade

Vue permite construir dashboards complexos com menos boilerplate.

---

## 2. Reatividade nativa

O sistema de reatividade do Vue combina perfeitamente com:

- SSE streams
- eventos em tempo real
- stores reativos

---

## 3. Ótimo para dashboards

Vue é muito forte em:

- painéis administrativos
- sistemas internos
- visualização de dados em tempo real

---

## 4. Curva de aprendizado

Mais rápida que React para esse tipo de projeto.

---

# Stack completa recomendada

## Core

- Vue 3 (Composition API)
- TypeScript
- Vite

---

## State Management

- Pinia

---

## Comunicação com backend

- Fetch API (REST)
- GraphQL Client (Apollo ou urql)
- SSE native (EventSource)

---

## UI Layer

Sugestão:

- TailwindCSS
- Headless UI (opcional)

---

## Charts / Visualização

- Chart.js ou ECharts

---

# Alternativa (se quiser React)

## React 18 + TypeScript

Funciona muito bem também, porém:

- mais boilerplate
- mais decisões arquiteturais

---

## State

- Zustand ou Redux Toolkit

---

## Realtime

- EventSource (SSE)

---

# Comparação direta

| Critério | Vue 3 | React |
|----------|------|-------|
| Simplicidade | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Tempo real (SSE) | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Boilerplate | baixo | médio/alto |
| Dashboard | excelente | excelente |
| Curva de aprendizado | rápida | média |

---

# Decisão do projeto

## ✔ Escolha final: Vue 3

Motivo:

> foco em aprendizado de arquitetura backend + eventos, não em complexidade frontend

---

# Estrutura base

```text id="stack_tree1"
apps/web/
  src/
    components/
    pages/
    stores/
    services/
    streams/
    types/
```

---

# Integração com backend

## SSE

```text id="stack_sse1"
Backend → EventSource → Store → UI update
```

---

## GraphQL

Usado apenas para:

- dashboards agregados
- queries complexas

---

## REST

Usado para:

- autenticação
- criação de charges
- ações simples

---

# Princípio do frontend

> Frontend não decide nada — apenas reflete eventos do backend.

---

# Boas práticas

- estado mínimo global
- UI reativa a eventos
- nenhuma regra de negócio no frontend
- separação clara de serviços e UI
- consumo orientado a streams

---

# Resultado esperado

Com essa stack teremos:

- dashboard leve e rápido
- integração perfeita com SSE
- baixo custo de manutenção
- foco total no aprendizado de arquitetura distribuída

---

# Próximo documento

```
dashboard.md
```

Aqui vamos desenhar exatamente como será a interface do sistema (layout, telas e experiência do usuário).
```