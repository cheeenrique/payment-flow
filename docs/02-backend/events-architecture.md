# Events Architecture

## Visão Geral

Sistema event-driven baseado em RabbitMQ + SSE.

O backend é um **monólito modular** (decisão KISS): fila única + dispatch in-process.
Não há topic exchange por domínio nem filas separadas por módulo — o NestJS roteia
cada mensagem pelo `@EventPattern` para o handler correto dentro do mesmo processo.

---

## Convenção de routing key

```
<domínio>.<ação>.v<versão>
```

Exemplos em uso:

```
charge.created.v1
charge.updated.v1
charge.canceled.v1
charge.expired.v1
charge.payment_requested.v1

payment.created.v1
payment.processing.v1
payment.approved.v1
payment.failed.v1
payment.expiring_soon.v1

invoice.requested.v1
invoice.issued.v1
invoice.failed.v1

notification.created.v1

auth.user.logged_in.v1
system.retry.executed.v1
```

---

## Topologia RabbitMQ

### Exchange

Exchange padrão do RabbitMQ (`''`, direct). Não há exchange customizado.
O publisher envia direto para a fila via `sendToQueue`.

### Filas

| Fila               | Função                                          |
|--------------------|------------------------------------------------|
| `payment-flow`     | Fila principal — todos os domain events        |
| `payment-flow.dlq` | Dead-letter queue — mensagens rejeitadas após retry |

#### Declaração da fila principal

A fila `payment-flow` é declarada com argumentos de dead-letter:

```json
{
  "durable": true,
  "arguments": {
    "x-dead-letter-exchange": "",
    "x-dead-letter-routing-key": "payment-flow.dlq"
  }
}
```

Os mesmos argumentos são usados em três locais — devem ser idênticos para
evitar `PRECONDITION_FAILED` do broker:

1. `main.ts` — `connectMicroservice` (consumer NestJS)
2. `rabbit.module.ts` — `ClientsModule` (publisher NestJS)
3. `messaging-setup.service.ts` — assertion explícita no `OnModuleInit`

---

## Fluxo de publicação

```
Módulo de domínio
  → EventBusService.publish(event)
    → ClientProxy.emit(pattern, data)
      → sendToQueue('payment-flow', packet)
```

O `packet` tem formato `{ pattern, data }` (convenção NestJS microservices).
O campo `data` contém o `IntegrationEvent` serializado como JSON.

---

## Fluxo de consumo

```
RabbitMQ: payment-flow
  → NestJS ServerRMQ (connectMicroservice em main.ts)
    → handleMessage() → identifica pattern
      → dispatch in-process via @EventPattern
        → handler A (ex: TimelineConsumer)
        → handler B (ex: NotificationConsumer)   ← encadeados se mesmo pattern
```

**NestJS NÃO gerencia ACK/NACK automaticamente para `@EventPattern`.**
Com `noAck: false`, cada mensagem exige confirmação explícita pelo handler.

---

## Política de ACK/NACK

### Padrões exclusivos (um único handler)

Ex: `charge.payment_requested.v1` → só `PaymentEventsConsumer`.

O handler usa `@Ctx() ctx: RmqContext` para controle manual:

| Situação | Ação |
|----------|------|
| Sucesso | `channel.ack(msg)` |
| Erro, `x-retry-count < RETRY_MAX_ATTEMPTS` | `channel.ack(msg)` + `EventBusService.republish(event, count + 1)` |
| Erro, `x-retry-count >= RETRY_MAX_ATTEMPTS` | `channel.nack(msg, false, false)` → DLQ |

### Padrões compartilhados (múltiplos handlers)

Ex: `charge.created.v1` → `ChargeCreatedConsumer` + `NotificationConsumer` + `TimelineConsumer`.

O NestJS passa o **mesmo `RmqContext`** para todos os handlers encadeados.
ACK/NACK individual causaria double-ack. Estratégia adotada:

- Cada handler captura erros internamente (sem relançar).
- Mensagens ficam **unacked** e são reenviadas no reconect.
- Aceito pois todos os handlers são idempotentes.

---

## Política de retry

Implementada em `@/infra/messaging/retry-policy.helper.ts`.

- `RETRY_MAX_ATTEMPTS = 3` (4 entregas no total: 1 original + 3 retries)
- Contador no header AMQP `x-retry-count` (inserido por `EventBusService.republish`)
- Retry: ACK do original + republica com `x-retry-count + 1`
- DLQ: `channel.nack(msg, false, false)` → broker rota para `payment-flow.dlq`

O header `x-retry-count` fica na camada de transporte (AMQP properties.headers),
não no payload do `IntegrationEvent` — domínio não é poluído com metadados de infra.

---

## Dead-Letter Queue (DLQ)

`payment-flow.dlq` é assertada pelo `MessagingSetupService` no `OnModuleInit`,
antes do consumer iniciar. Sem essa assertiva, mensagens dead-letteradas seriam
descartadas silenciosamente pelo broker (exchange padrão descarta se a fila não existe).

Mensagens na DLQ ficam aguardando análise manual. Não há reprocessamento automático.
Para reprocessar: via RabbitMQ Management UI (shovel) ou script dedicado.

---

## Módulo de infra: `@/infra/messaging/`

| Arquivo | Responsabilidade |
|---------|-----------------|
| `rabbit.module.ts` | Registra `ClientProxy` (EVENT_BUS) + exporta `PAYMENT_FLOW_QUEUE_ARGS` |
| `event-bus.service.ts` | Publisher: `publish()` e `republish()` (com header x-retry-count) |
| `messaging-setup.service.ts` | Asserta `payment-flow` e `payment-flow.dlq` no bootstrap |
| `retry-policy.helper.ts` | Funções puras: `getRetryCount`, `hasExceededRetryLimit`, `RETRY_MAX_ATTEMPTS` |

---

## SSE Gateway

Após persistir cada evento na Timeline, o `TimelineConsumer` emite via SSE:

```
TimelineConsumer.processEvent()
  → SseService.emit({ type, data })
    → Subject → stream$ → frontend (EventSource)
```

---

## Limitações e evolução futura

- **Retry para padrões compartilhados**: não implementado. Mensagens de padrões
  compartilhados dependem de reconect para redelivery. Evolução possível: criar
  um consumer específico por padrão (filas separadas por domínio) ou usar
  interceptor global de ACK que aguarda todos os handlers encadeados.

- **Delay entre retries**: não há backoff. O retry (republish) é imediato.
  Evolução: adicionar `x-delay` via RabbitMQ Delayed Message Plugin.

- **Observabilidade da DLQ**: sem alarme automático. Evolução: consumer da DLQ
  que emite métricas/alertas.

- **Escalabilidade**: para escalar horizontalmente, múltiplas instâncias
  compartilham a mesma fila (competing consumers). A fila única é compatível
  com essa estratégia — sem mudança de topologia.
