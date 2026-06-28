# Events System

## Visão Geral

Este documento define como o sistema de eventos funciona no Payment Flow.

O objetivo é permitir comunicação assíncrona, desacoplada e escalável entre módulos usando RabbitMQ.

---

# Princípio principal

> Todo estado relevante no sistema gera um evento.

---

# Arquitetura de eventos

## Fluxo base

```text id="evt_flow1"
Domain Event

↓

Application Layer

↓

Event Publisher

↓

RabbitMQ Exchange

↓

Queue(s)

↓

Consumers

↓

Side Effects
```

---

# Tipos de eventos

## 1. Domain Events

Eventos internos do domínio.

Exemplo:

- PaymentApproved
- ChargeCreated

❌ Não saem do módulo diretamente

---

## 2. Integration Events

Eventos publicados no RabbitMQ.

Exemplo:

- payment.approved.v1
- charge.created.v1

✔ usados por outros módulos

---

# Estrutura de evento

```ts id="evt_struct1"
export interface IntegrationEvent {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: Date;
  payload: any;
  correlationId: string;
}
```

---

# Naming convention

## Padrão

```text id="evt_name1"
<domain>.<event>.<version>
```

## Exemplos

- payment.approved.v1
- charge.created.v1
- invoice.issued.v1

---

# RabbitMQ topology

## Exchange

- type: topic
- name: payment-flow.events

---

## Queues

```text id="evt_queue1"
payments.queue
charges.queue
invoices.queue
notifications.queue
timeline.queue
```

---

## Routing Keys

- payment.approved.v1
- charge.created.v1
- invoice.issued.v1

---

# Fluxo de publicação

## Exemplo: Payment aprovado

```text id="evt_flow2"
Payment Service

↓

Emite Domain Event

↓

Mapeia para Integration Event

↓

Publica no RabbitMQ

↓

Exchange roteia para filas

↓

Consumers processam evento
```

---

# Consumers (assinantes)

## Payments Consumer

- reage a charge.created.v1

---

## Invoices Consumer

- reage a payment.approved.v1

---

## Notifications Consumer

- reage a todos eventos relevantes

---

## Timeline Consumer

- consome TODOS os eventos

---

# Garantias do sistema

## 1. At-least-once delivery

Eventos podem ser entregues mais de uma vez

→ consumidores devem ser idempotentes

---

## 2. Idempotência

Todo consumer deve garantir:

```text id="evt_idemp1"
mesmo evento não pode gerar efeito duplicado
```

---

## 3. Retry policy

Falhas são reprocessadas automaticamente

---

## 4. DLQ (Dead Letter Queue)

Eventos que falham vão para fila de erro

---

# Correlation ID

## Importância

Permite rastrear fluxo completo:

```text id="evt_corr1"
charge.created
payment.created
payment.approved
invoice.issued
notification.sent
```

Todos com mesmo correlationId.

---

# Event Publisher

```ts id="evt_pub1"
@Injectable()
export class EventPublisher {
  constructor(private client: ClientProxy) {}

  emit(event: IntegrationEvent) {
    return this.client.emit(event.type, event);
  }
}
```

---

# Consumer base

```ts id="evt_cons1"
@EventPattern('payment.approved.v1')
export class PaymentApprovedConsumer {
  handle(event: IntegrationEvent) {
    // side effect
  }
}
```

---

# Integração com módulos

## Charges

- emite charge.created

---

## Payments

- consome charge.created
- emite payment.approved

---

## Invoices

- consome payment.approved

---

## Notifications

- consome todos eventos relevantes

---

## Timeline

- consome todos eventos (audit layer)

---

# Estratégia de consistência

## Eventual consistency

O sistema não depende de transações globais.

---

## Order independence

Eventos podem chegar fora de ordem (tratado via correlationId)

---

# Benefícios

- desacoplamento total
- escalabilidade horizontal
- fácil extensão de módulos
- arquitetura real de produção
- simulação de sistemas financeiros reais

---

# Regras importantes

- nunca depender de chamada direta entre módulos
- eventos são fonte de integração
- consumers devem ser idempotentes
- eventos nunca são alterados
- versionamento obrigatório

---

# Resultado esperado

Com esse sistema:

- backend vira event-driven real
- módulos são independentes
- escalabilidade é natural
- auditoria é completa
- integração é simples

---

# Próximo documento

```
testing.md
```

Aqui vamos definir como testar toda essa arquitetura de forma confiável (unit, integration e e2e).
```