# Architecture

## Visão Geral

A arquitetura do **Payment Flow** foi projetada para simular um sistema moderno de processamento de pagamentos baseado em eventos, com foco em modularidade, escalabilidade e separação de responsabilidades.

O sistema inicia como um **Monólito Modular**, mas já é estruturado para permitir evolução futura para microsserviços sem alterações significativas no domínio.

---

## Princípios Arquiteturais

### 1. Modularidade

O sistema é dividido por domínio de negócio.

Cada módulo é independente e contém:

- Application Layer (casos de uso)
- Domain Layer (regras de negócio)
- Infrastructure Layer (implementações técnicas)
- Presentation Layer (HTTP, GraphQL, SSE)

---

### 2. Baixo Acoplamento

Módulos NÃO se comunicam diretamente.

Toda comunicação ocorre via:

- Eventos de domínio
- RabbitMQ

---

### 3. Alta Coesão

Cada módulo contém apenas lógica relacionada ao seu domínio.

Exemplo:

- Payments não conhece Customers
- Charges não conhece Invoices

---

### 4. Event-Driven Architecture

O sistema é orientado a eventos.

Toda mudança de estado relevante gera um evento.

Exemplo:

- `charge.created`
- `payment.approved`
- `payment.failed`
- `invoice.generated`

---

### 5. Separação de Command e Query (CQRS pragmático)

- REST → comandos (escrita)
- GraphQL → consultas (leitura)

---

## Visão Geral do Sistema

```text id="arch1"
                 ┌──────────────┐
                 │    Vue UI    │
                 └──────┬───────┘
                        │
          ┌─────────────┴─────────────┐
          │                           │
        REST                       GraphQL
          │                           │
          └─────────────┬─────────────┘
                        │
                 NestJS API (Monolith)
                        │
        ┌───────────────┴───────────────┐
        │                               │
   Domain Events                   SSE Gateway
        │                               │
   RabbitMQ (Broker) --------------------
        │
   Consumers / Workers
        │
     MongoDB
        │
   Event Projections
        │
   Dashboard Updates (SSE)
```

---

## Estrutura do Monólito Modular

```text id="arch2"
apps/api/src/

modules/
    auth/
    customers/
    charges/
    payments/
    invoices/
    notifications/
    timeline/
    simulator/
```

---

## Estrutura interna de cada módulo

Cada módulo segue a mesma organização:

```text id="arch3"
payments/

application/
    use-cases/

domain/
    entities/
    events/
    repositories/
    value-objects/

infrastructure/
    database/
    messaging/
    repositories/

presentation/
    http/
    graphql/
    sse/

tests/
```

---

## Fluxo de execução (Command Flow)

```text id="arch4"
User Request (REST)

→ Controller (Presentation)

→ Use Case (Application)

→ Domain Logic

→ Repository (Interface)

→ Infrastructure (MongoDB)

→ Domain Event Emitted

→ RabbitMQ

→ Consumer (Worker)

→ Side Effects (Invoice, Notification, Timeline)

→ SSE Event Published

→ Frontend Updates
```

---

## Fluxo de leitura (Query Flow)

```text id="arch5"
Frontend

→ GraphQL Query

→ Query Resolver

→ Read Model (MongoDB Projection)

→ Response

→ Vue Cache (Vue Query)

→ UI Render
```

---

## Server-Sent Events (SSE)

O sistema utiliza SSE para comunicação em tempo real.

### Características:

- Unidirecional (backend → frontend)
- Baseado em eventos
- Leve e simples
- Ideal para dashboards

### Uso:

- Atualização de status de pagamentos
- Atualização da timeline
- Notificações em tempo real

---

## RabbitMQ

O RabbitMQ é responsável por:

- Comunicação entre módulos
- Processamento assíncrono
- Retry de eventos
- Dead Letter Queue (DLQ)

---

### Tipos de eventos

- Domain Events
- Integration Events
- System Events

---

## MongoDB

MongoDB é utilizado como banco principal por:

- Flexibilidade de schema
- Modelagem orientada a eventos
- Facilidade de projeções (read models)

---

## Separação de responsabilidades

| Camada | Responsabilidade |
|--------|-----------------|
| Domain | Regras de negócio |
| Application | Orquestração |
| Infrastructure | Implementação técnica |
| Presentation | Entrada e saída |

---

## Regras arquiteturais

### Proibido

- Acesso direto entre módulos
- Lógica de negócio em controllers
- Uso de banco no Domain
- Dependência entre serviços de domínio

---

### Permitido

- Comunicação via eventos
- Injeção de dependências controlada
- Repositories como abstração
- Use cases isolados

---

## Evolução futura

A arquitetura já está preparada para:

### Microsserviços

Cada módulo pode ser extraído individualmente:

- payments-service
- invoices-service
- customers-service

---

### Escalabilidade horizontal

- Workers independentes
- Consumers escaláveis
- Read models separados

---

## Objetivo final da arquitetura

Garantir que o sistema seja:

- Modular
- Evolutivo
- Testável
- Observável
- Fácil de entender
- Próximo de sistemas reais de produção

---

## Próximo documento

```
technology-stack.md
```

Este documento definirá:

- Todas as tecnologias escolhidas
- Justificativa de cada uma
- Alternativas consideradas
- Trade-offs técnicos
```