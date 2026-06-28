# Frontend Architecture

## Visão Geral

Frontend do Payment Flow é um sistema reativo baseado em:

- Vue 3
- Pinia
- SSE
- GraphQL (leitura)
- REST (ações)

---

# Estrutura lógica

```text id="fe_arch1"
UI → Store (Pinia) → Services → API / SSE / GraphQL → Backend
```

---

# Camadas

## 1. UI Layer
- components
- pages
- layouts

## 2. State Layer
- Pinia stores

## 3. Service Layer
- API client
- SSE client
- GraphQL client

---

# Regra principal

> UI nunca fala direto com backend