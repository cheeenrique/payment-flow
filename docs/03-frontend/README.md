# Frontend (Dashboard)

## Visão Geral

Esta seção define o frontend do Payment Flow.

O objetivo é criar um **dashboard em tempo real** que consome eventos do backend e exibe o fluxo completo de pagamentos, cobranças e notificações.

---

# Objetivo do frontend

O frontend tem como objetivo:

- visualizar charges, payments e invoices
- acompanhar timeline em tempo real
- receber notificações via SSE
- exibir status do sistema de forma clara
- simular comportamento de sistema financeiro real

---

# Princípio principal

> O frontend é uma projeção do backend event-driven.

Nada é “fixo” — tudo é reativo.

---

# Estrutura geral

```text id="fe_structure1"
apps/web/
  src/
    pages/
    components/
    services/
    stores/
    streams/
    utils/
```

---

# Fluxo de dados

```text id="fe_flow1"
Backend (Events)

↓

SSE / GraphQL / REST

↓

Frontend Store

↓

UI Components

↓

Dashboard atualizado em tempo real
```

---

# Conceito de dashboard

O dashboard será dividido em 4 áreas principais:

---

## 1. Charges View

- lista de cobranças
- status em tempo real
- filtros por cliente e status

---

## 2. Payments View

- histórico de pagamentos
- status (pending, approved, failed)
- simulação de processamento

---

## 3. Invoices View

- notas fiscais geradas
- status de emissão
- tempo de processamento

---

## 4. Timeline View

- fluxo completo de eventos
- auditoria visual
- rastreio por correlationId

---

# Atualização em tempo real

## Estratégia principal: SSE

```text id="fe_sse1"
Backend → SSE Stream → Frontend Listener → UI Update
```

---

## O que será atualizado em tempo real:

- status de payment
- criação de charge
- emissão de invoice
- notificações
- timeline events

---

# State Management

## Estratégia

- estado global leve
- store reativo

Sugestão:

- Pinia (Vue) OU
- Zustand (React)

---

# Reatividade do sistema

O frontend não faz polling.

Ele reage a eventos:

```text id="fe_react1"
Event recebido → update store → UI muda automaticamente
```

---

# Tipos de dados no frontend

## Charge

```ts id="fe_charge1"
type Charge = {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'expired';
  customerId: string;
};
```

---

## Payment

```ts id="fe_payment1"
type Payment = {
  id: string;
  chargeId: string;
  status: 'processing' | 'approved' | 'failed';
};
```

---

## Timeline Event

```ts id="fe_timeline1"
type TimelineEvent = {
  id: string;
  type: string;
  aggregateId: string;
  timestamp: string;
};
```

---

# Integração com backend

## REST

- criação de charges
- login
- consultas simples

---

## GraphQL

- dashboards agregados
- consultas complexas

---

## SSE

- updates em tempo real

---

# UX principal

## Fluxo do usuário

```text id="fe_userflow1"
Login

↓

Dashboard

↓

Cria Charge

↓

Payment simulado

↓

Status muda em tempo real

↓

Invoice aparece

↓

Timeline atualiza automaticamente
```

---

# Componentização

## Componentes principais

- ChargeList
- PaymentStatusCard
- InvoicePanel
- TimelineStream
- NotificationToast

---

# Notificações

## Estratégia

- toast system
- SSE-driven
- não intrusivo

---

# Timeline UI

## Características

- lista contínua
- agrupada por correlationId
- scroll infinito

---

# Performance

- updates incrementais
- sem reload de página
- estado mínimo global
- cache leve

---

# Boas práticas

- UI nunca contém regra de negócio
- tudo vem do backend
- estado centralizado
- reatividade por eventos
- separação clara de views

---

# Benefícios da arquitetura

- sistema altamente reativo
- experiência em tempo real
- fácil debug visual
- simulação de sistemas reais
- escalabilidade frontend

---

# Resultado esperado

Com esse frontend teremos:

- dashboard financeiro realista
- visualização completa de eventos
- sistema totalmente reativo
- integração forte com SSE + GraphQL

---

# Próximo documento

```
stack.md
```

Aqui vamos definir qual stack frontend usar (Vue, React ou alternativa) e justificar a escolha dentro do projeto.
```