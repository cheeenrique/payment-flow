# Backend (NestJS)

## Visão Geral

Esta seção descreve como o backend do **Payment Flow** será estruturado utilizando NestJS.

O objetivo é transformar toda a modelagem de domínio em um sistema funcional, organizado, testável e escalável.

---

# Objetivo desta seção

O Backend tem como objetivo:

- Implementar o domínio definido na seção 01-domain
- Aplicar arquitetura modular
- Garantir separação de responsabilidades
- Integrar REST, GraphQL, RabbitMQ e SSE
- Estabelecer padrões de código consistentes

---

# Princípios do Backend

## 1. Modularidade

Cada domínio será implementado como um módulo isolado:

- auth
- customers
- charges
- payments
- invoices
- notifications
- timeline
- simulator

---

## 2. Separação de camadas

Cada módulo seguirá a estrutura:

- Domain (regras de negócio)
- Application (use cases)
- Infrastructure (implementações técnicas)
- Presentation (controllers, resolvers, gateways)

---

## 3. Event-driven first

O backend é orientado a eventos:

- Toda mudança relevante gera evento
- Eventos são propagados via RabbitMQ
- Consumers reagem a eventos para side effects

---

## 4. Command / Query separation

- REST → comandos (escrita)
- GraphQL → leitura
- SSE → atualização em tempo real

---

# Arquitetura geral do backend

```text id="be_arch1"
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

shared/
    domain/
    infrastructure/
    events/
    utils/
```

---

# Fluxo geral de execução

```text id="be_flow1"
REST Request

↓

Controller (Presentation)

↓

Use Case (Application)

↓

Domain Logic

↓

Repository Interface

↓

Infrastructure (MongoDB)

↓

Domain Event Emitted

↓

RabbitMQ

↓

Consumers (side effects)

↓

SSE Updates

↓

Frontend Sync
```

---

# Tipos de comunicação

## REST (Command Side)

Usado para:

- criar charge
- iniciar payment
- cancelar cobrança

---

## GraphQL (Query Side)

Usado para:

- dashboards
- consultas complexas
- relatórios

---

## SSE (Real-time)

Usado para:

- updates de status
- notificações ao vivo
- timeline streaming

---

## RabbitMQ (Event Bus)

Usado para:

- comunicação entre módulos
- processamento assíncrono
- retry e DLQ

---

# Padrões adotados

## Use Cases

Toda regra de negócio vive em use cases:

```text id="be_uc1"
CreateCharge
ProcessPayment
GenerateInvoice
```

---

## Repositories

Abstraem acesso ao MongoDB:

- interface no domain
- implementação na infrastructure

---

## Events

Eventos são gerados pelo domínio:

- charge.created
- payment.approved

---

## Consumers

Reagem a eventos:

- notifications
- timeline
- invoices

---

# Organização de responsabilidades

| Camada | Responsabilidade |
|--------|-----------------|
| Domain | regras de negócio |
| Application | orquestração |
| Infrastructure | banco, broker, APIs externas |
| Presentation | HTTP / GraphQL / SSE |

---

# Comunicação entre módulos

Módulos NÃO se chamam diretamente.

Exemplo:

```text id="be_mod1"
Payments NÃO chama Invoices diretamente

↓

Payment emite evento

↓

Invoices consome evento

↓

Executa ação
```

---

# Shared Module

Contém:

- eventos base
- helpers
- tipos comuns
- decorators
- utilities

---

# Regras do backend

- Nenhuma regra de negócio em controller
- Domain não depende de framework
- Eventos são imutáveis
- Cada módulo é independente
- Comunicação sempre via eventos

---

# Integrações principais

## MongoDB

- persistência principal
- read models
- projections

---

## RabbitMQ

- backbone de eventos
- desacoplamento entre módulos

---

## SSE

- comunicação em tempo real
- dashboard reativo

---

## GraphQL

- leitura otimizada
- agregação de dados

---

# Objetivo final do backend

O backend deve:

- simular sistema real de pagamentos
- ser modular e escalável
- ser totalmente orientado a eventos
- permitir evolução para microsserviços
- ser altamente testável

---

# Próximo documento

```
nestjs.md
```

Aqui vamos detalhar:

- configuração inicial do NestJS
- padrões de bootstrap
- estrutura de módulos reais
- boas práticas de projeto
```