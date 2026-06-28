# SSE Integration (Real-time Updates)

## Visão Geral

Este documento define como o frontend do Payment Flow consome eventos em tempo real via **Server-Sent Events (SSE)**.

O objetivo é manter o dashboard sempre atualizado sem polling.

---

# Princípio principal

> O frontend não pergunta “o que mudou” — ele recebe o que mudou.

---

# Tecnologia escolhida

## 👉 Server-Sent Events (EventSource)

---

# Por que SSE?

## Vantagens:

- conexão simples HTTP
- baixa latência
- ideal para dashboards
- menos complexidade que WebSocket
- perfeito para “event stream one-way”

---

# Fluxo geral

```text id="sse_flow1"
Backend (NestJS SSE Gateway)

↓

Event Stream HTTP

↓

Frontend EventSource

↓

Store Dispatcher

↓

UI reativa
```

---

# Endpoint SSE

```text id="sse_endpoint1"
GET /events/stream
```

---

# Estrutura do evento

```json id="sse_event1"
{
  "type": "payment.approved",
  "timestamp": "2026-06-28T10:00:00Z",
  "correlationId": "uuid",
  "payload": {
    "paymentId": "123",
    "status": "approved"
  }
}
```

---

# Conexão no frontend

```ts id="sse_connect1"
export function createEventStream() {
  const eventSource = new EventSource('/events/stream');

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);

    handleEvent(data);
  };

  eventSource.onerror = (err) => {
    console.error('SSE error:', err);
  };

  return eventSource;
}
```

---

# Dispatcher de eventos

```ts id="sse_dispatch1"
export function handleEvent(event: any) {
  switch (event.type) {
    case 'charge.created':
      chargesStore.updateCharge(event.payload);
      break;

    case 'payment.approved':
      paymentsStore.update(event.payload);
      break;

    case 'invoice.issued':
      invoicesStore.add(event.payload);
      break;

    case 'notification.created':
      notificationsStore.add(event.payload);
      break;

    case 'timeline.event':
      timelineStore.add(event.payload);
      break;
  }
}
```

---

# Integração com Pinia

## Inicialização global

```ts id="sse_store1"
onMounted(() => {
  createEventStream();
});
```

---

# Reconexão automática

## Estratégia

```text id="sse_reconnect1"
Connection lost → wait → reconnect → resume stream
```

---

## Implementação simples

```ts id="sse_reconnect2"
function connectWithRetry(retries = 0) {
  const eventSource = new EventSource('/events/stream');

  eventSource.onerror = () => {
    eventSource.close();

    setTimeout(() => {
      connectWithRetry(retries + 1);
    }, Math.min(1000 * retries, 10000));
  };
}
```

---

# Sincronização de estado

## Regra principal

> SSE nunca substitui estado inicial — apenas atualiza.

---

## Fluxo híbrido

```text id="sse_sync1"
REST (initial load)
   ↓
Pinia Store
   ↓
SSE updates
   ↓
Reactive UI
```

---

# Tipos de eventos suportados

```ts id="sse_types1"
type SSEEvent =
  | 'charge.created'
  | 'charge.updated'
  | 'payment.processing'
  | 'payment.approved'
  | 'payment.failed'
  | 'invoice.issued'
  | 'notification.created'
  | 'timeline.event';
```

---

# Segurança

## Regras

- SSE usa JWT no query param ou cookie
- stream autenticado
- conexão por usuário

---

## Exemplo

```text id="sse_auth1"
GET /events/stream?token=JWT
```

---

# Performance

- payload leve
- eventos pequenos
- sem polling
- conexão persistente única

---

# Boas práticas

- não fazer lógica complexa no handler
- delegar tudo para stores
- manter eventos idempotentes
- sempre validar payload

---

# Benefícios

- UI em tempo real
- arquitetura reativa completa
- baixa complexidade
- ótima performance
- ideal para dashboards financeiros

---

# Integração com backend

Backend envia eventos via:

- RabbitMQ → SSE Gateway
- Timeline Module
- Notifications Module
- Payments Module

---

# Resultado esperado

Com SSE teremos:

- dashboard vivo
- updates instantâneos
- zero refresh manual
- experiência real de sistema financeiro

---

# Próximo documento

```
graphql-client.md
```

Aqui vamos definir como o frontend vai usar GraphQL para consultas agregadas e dashboards mais complexos.
```