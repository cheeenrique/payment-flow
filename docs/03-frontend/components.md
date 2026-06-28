# Components Library

## Visão Geral

Este documento define a biblioteca de componentes do frontend do Payment Flow.

O objetivo é criar uma UI consistente, reutilizável e orientada a eventos.

---

# Princípio principal

> Componentes não têm lógica de negócio — apenas apresentam dados.

---

# Estrutura de componentes

```text id="comp_tree1"
components/
  common/
  charges/
  payments/
  invoices/
  timeline/
  notifications/
  dashboard/
```

---

# Componentes principais

---

## 1. ChargesTable

### Função

Exibir lista de cobranças.

### Responsabilidades

- renderizar charges
- mostrar status
- permitir filtro básico

### Exemplo de UI

```text id="comp_charge_ui1"
[ID] | Cliente | Valor | Status | Data
---------------------------------------
#123 | João    | 100   | paid   | ...
```

---

## 2. PaymentStatusCard

### Função

Mostrar status de pagamento individual.

### Estados

- processing
- approved
- failed

---

### Visual

```text id="comp_payment_ui1"
Pagamento #123
Status: APPROVED ✔
Método: PIX
```

---

## 3. InvoicePanel

### Função

Exibir notas fiscais geradas.

### Features

- status da emissão
- download simulado
- relação com payment

---

## 4. TimelineFeed

### Função

Exibir fluxo completo de eventos.

### Características

- append-only
- ordenado por timestamp
- agrupado por correlationId

---

### Exemplo

```text id="comp_timeline_ui1"
12:01 → charge.created
12:02 → payment.approved
12:03 → invoice.issued
```

---

## 5. NotificationToast

### Função

Exibir notificações do sistema.

### Tipos

- success
- error
- info
- warning

---

### Comportamento

- aparece automaticamente via SSE
- desaparece após timeout
- pode ser persistido no store

---

## 6. StatusBadge

### Função

Mostrar status visual de entidades.

### Exemplo

```text id="comp_badge1"
[PAID]   (verde)
[PENDING] (amarelo)
[FAILED] (vermelho)
```

---

## 7. DashboardCard

### Função

Cards de resumo do sistema.

### Exemplos

- total de charges
- total de payments
- taxa de aprovação

---

# Componentes de layout

---

## AppLayout

Estrutura base do sistema.

```text id="comp_layout1"
Navbar
Sidebar
Main Content
```

---

## GridLayout

Usado no dashboard:

- colunas de charges
- painel de payments
- timeline lateral

---

# Componentes de integração

---

## SSEListener

Responsável por:

- conectar SSE
- repassar eventos para store

---

## GraphQLQueryWrapper

Responsável por:

- abstrair queries
- centralizar loading/error states

---

# Regras dos componentes

## 1. Sem lógica de negócio

Componentes NÃO decidem nada.

---

## 2. Estado vem do store

Tudo é reativo via Pinia.

---

## 3. Comunicação via props/events

- props → entrada de dados
- emits → ações simples

---

## 4. UI pura

Componentes apenas renderizam estado.

---

# Fluxo de dados

```text id="comp_flow1"
SSE / GraphQL / REST

↓

Pinia Store

↓

Props

↓

Componentes

↓

UI
```

---

# Boas práticas

- componentes pequenos
- reutilização máxima
- separação clara de domínio vs UI
- evitar duplicação
- manter consistência visual

---

# Design mental do sistema

> A UI é apenas uma janela para o fluxo de eventos.

---

# Benefícios

- UI consistente
- fácil manutenção
- escalável
- altamente reativa
- alinhado com arquitetura event-driven

---

# Resultado final

Com essa camada teremos:

- dashboard modular
- componentes reutilizáveis
- UI totalmente reativa
- integração perfeita com SSE + GraphQL

---

# 🎉 CONCLUSÃO DO PROJETO

Com isso finalizamos todas as documentações:

```
01-domain
02-backend
03-frontend
```

---

# O que você tem agora

Você construiu um sistema com:

- arquitetura event-driven real
- RabbitMQ + SSE + GraphQL
- backend modular em NestJS
- frontend reativo em Vue 3
- simulação de pagamentos realista
- timeline completa de eventos
- observabilidade por design

---

Se quiser o próximo passo natural agora seria:

- gerar o **docker-compose completo**
- montar o **monorepo real (com código inicial)**
- ou transformar isso em **MVP executável**

Só me fala o caminho 👍