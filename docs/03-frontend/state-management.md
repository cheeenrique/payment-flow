# State Management

## Visão Geral

Este documento define como o estado do frontend do Payment Flow será gerenciado.

O objetivo é manter o dashboard consistente, reativo e sincronizado com o backend em tempo real.

---

# Estratégia escolhida

## 👉 Pinia (Vue 3)

---

# Princípio principal

> O estado do frontend é uma projeção dos eventos do backend.

---

# Estrutura de stores

```text id="state_tree1"
stores/
  charges.store.ts
  payments.store.ts
  invoices.store.ts
  timeline.store.ts
  notifications.store.ts
  dashboard.store.ts
```

---

# Store principal (Dashboard Store)

```ts id="state_store1"
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    charges: [],
    payments: [],
    invoices: [],
    timeline: [],
    notifications: [],
  }),

  actions: {
    setCharges(data) {
      this.charges = data;
    },

    addTimelineEvent(event) {
      this.timeline.unshift(event);
    },

    addNotification(notification) {
      this.notifications.unshift(notification);
    },
  },
});
```

---

# Estratégia de atualização

## 1. Inicialização (REST)

```text id="state_init1"
Frontend carrega dados iniciais via REST
```

- charges
- payments
- invoices
- timeline

---

## 2. Atualização contínua (SSE)

```text id="state_sse1"
Backend → SSE → Store update → UI reativa
```

---

# Stores individuais

---

## Charges Store

```ts id="state_charges1"
export const useChargesStore = defineStore('charges', {
  state: () => ({
    list: [],
  }),

  actions: {
    updateCharge(charge) {
      const index = this.list.findIndex(c => c.id === charge.id);

      if (index !== -1) {
        this.list[index] = charge;
      }
    },
  },
});
```

---

## Payments Store

- rastreia status de pagamentos
- sincronizado com charges

---

## Timeline Store

- append-only
- ordenação por timestamp
- consumo direto de SSE

---

## Notifications Store

- lista de notificações ativas
- remove após leitura
- suporta toast system

---

# Integração com SSE

## Fluxo principal

```text id="state_flow1"
SSE Event Received

↓

Parse event

↓

Identify type

↓

Update store específico

↓

UI reage automaticamente
```

---

# Tipos de eventos no frontend

```ts id="state_events1"
type FrontendEvent =
  | 'charge.created'
  | 'charge.updated'
  | 'payment.approved'
  | 'payment.failed'
  | 'invoice.issued'
  | 'notification.created';
```

---

# Event Dispatcher (core)

```ts id="state_dispatch1"
export function handleEvent(event: any) {
  switch (event.type) {
    case 'charge.created':
      chargesStore.updateCharge(event.payload);
      break;

    case 'payment.approved':
      paymentsStore.update(event.payload);
      break;

    case 'notification.created':
      notificationsStore.add(event.payload);
      break;
  }
}
```

---

# Reatividade do sistema

## Regra principal

> Nenhum componente acessa API diretamente após inicialização.

Tudo vem do store.

---

# Sincronização de estado

## Estratégia híbrida

| Fonte | Uso |
|------|-----|
| REST | inicialização |
| SSE | updates em tempo real |
| GraphQL | consultas complexas |

---

# Consistência de dados

## Correlation ID

Usado para agrupar eventos:

```text id="state_corr1"
charge.created
payment.approved
invoice.issued
```

Todos atualizam o mesmo fluxo no store.

---

# Boas práticas

- stores pequenos e focados
- evitar lógica de negócio no frontend
- SSE como fonte de verdade
- updates imutáveis
- separação clara entre UI e estado

---

# Performance

- updates incrementais
- evita re-render global
- listeners leves
- estado mínimo necessário

---

# Benefícios

- UI sempre atualizada
- zero polling
- arquitetura reativa real
- fácil debugging
- escalável para sistemas grandes

---

# Resultado esperado

Com essa camada teremos:

- frontend totalmente reativo
- sincronização perfeita com backend
- dashboard confiável
- estado previsível
- arquitetura limpa

---

# Próximo documento

```
sse-integration.md
```

Aqui vamos definir como o frontend vai se conectar ao backend em tempo real usando SSE (EventSource).
```