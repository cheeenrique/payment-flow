# Timeline Module

## Visão Geral

O módulo **Timeline** é responsável por registrar toda a sequência de eventos do sistema Payment Flow.

Ele funciona como um histórico imutável e rastreável de tudo que acontece dentro do sistema.

---

# Responsabilidade do módulo

O Timeline Module é responsável por:

- Registrar eventos de todo o sistema
- Manter histórico completo de uma Charge
- Permitir rastreabilidade de ponta a ponta
- Agrupar eventos por entidade (charge, payment, invoice)
- Servir como base para auditoria e debugging

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Processar pagamentos
- Gerar notificações
- Executar lógica de domínio
- Alterar estado de entidades

---

# Entidade principal

## TimelineEvent

Representa um evento registrado no sistema.

### Campos:

- id
- eventType
- aggregateId (ex: chargeId)
- aggregateType (charge | payment | invoice | customer)
- payload
- timestamp
- correlationId
- metadata

---

# Tipos de eventos

A Timeline registra TODOS os eventos do sistema:

## Charges
- charge.created
- charge.updated
- charge.canceled
- charge.expired

## Payments
- payment.created
- payment.processing
- payment.approved
- payment.failed

## Invoices
- invoice.requested
- invoice.issued
- invoice.failed

## Notifications
- notification.created

## System
- auth.user.logged_in
- system.retry.executed

---

# Fluxo principal

## Registro de evento

```text id="tml_flow1"
Evento ocorre no sistema

↓

RabbitMQ publica evento

↓

Timeline Module consome evento

↓

Cria TimelineEvent

↓

Salva no MongoDB

↓

SSE envia atualização

↓

Frontend atualiza interface
```

---

# Estrutura de rastreabilidade

## Exemplo de uma Charge completa

```text id="tml_flow2"
charge.created
  ↓
payment.created
  ↓
payment.processing
  ↓
payment.approved
  ↓
invoice.requested
  ↓
invoice.issued
  ↓
notification.created
```

---

# Endpoints (REST - Query Side)

## GET /timeline

Lista eventos globais do sistema.

---

## GET /timeline/charge/:id

Lista todos os eventos de uma charge específica.

---

## GET /timeline/payment/:id

Lista eventos de um pagamento.

---

## GET /timeline/customer/:id

Lista eventos de um cliente.

---

# Persistência (MongoDB)

## Collection: timeline_events

```json id="tml_db1"
{
  "_id": "ObjectId",
  "eventType": "payment.approved",
  "aggregateId": "chargeId",
  "aggregateType": "charge",
  "payload": {},
  "correlationId": "uuid",
  "timestamp": "date"
}
```

---

# Correlation ID

## Importância

O correlationId permite rastrear uma operação completa através de todos os módulos.

---

## Exemplo

```text id="tml_corr1"
charge.created
payment.created
payment.approved
invoice.issued
notification.created
```

Todos compartilham o mesmo correlationId.

---

# Integração com arquitetura

## RabbitMQ

Timeline consome todos os eventos do sistema.

Ele é um **consumer global de auditoria**.

---

## SSE

Atualiza o frontend em tempo real:

- novos eventos
- mudanças de status
- progresso de fluxos

---

## GraphQL (futuro)

Permite consultas avançadas:

- filtros por período
- filtros por tipo de evento
- análise de fluxo completo

---

# Regras de negócio

- Todo evento deve ser registrado
- Eventos não podem ser alterados ou removidos
- Timeline é append-only
- Cada evento deve ter timestamp obrigatório
- CorrelationId deve ser obrigatório para rastreabilidade

---

# Importância no sistema

A Timeline é o **sistema de auditoria vivo do Payment Flow**.

Ela permite:

- debugging de fluxos
- análise de falhas
- rastreabilidade completa
- transparência do sistema

---

# Resultado esperado

Ao final deste módulo teremos:

- rastreamento completo de todas as ações
- auditoria centralizada
- histórico imutável de eventos
- base para observabilidade do sistema

---

# Próximo módulo

```
simulator.md
```

Aqui vamos criar o motor que simula comportamentos reais do sistema (atrasos, falhas, aprovações, etc).
```