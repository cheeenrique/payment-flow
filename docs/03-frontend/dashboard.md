# Dashboard

## Visão Geral

O Dashboard é a principal interface do Payment Flow.

Ele representa visualmente todo o sistema de pagamentos em tempo real, refletindo eventos vindos do backend.

---

# Princípio principal

> O dashboard não tem estado próprio — ele reflete o backend em tempo real.

---

# Layout geral

```text id="dash_layout1"
+--------------------------------------------------+
| Navbar                                           |
+----------------------+---------------------------+
| Charges List         | Timeline Stream          |
|                      |                           |
| Payments Status      | Notifications Panel      |
|                      |                           |
| Invoices Panel       |                           |
+----------------------+---------------------------+
```

---

# Seções do Dashboard

---

## 1. Charges Panel

### Função

Exibir todas as cobranças do sistema.

### Features

- status em tempo real
- criação de nova charge
- filtro por cliente
- atualização via SSE

---

### Estados

- pending
- paid
- expired
- canceled

---

## 2. Payments Panel

### Função

Mostrar processamento de pagamentos.

### Features

- status do pagamento
- simulação (pix, boleto, cartão)
- tempo de processamento

---

### Estados

- processing
- approved
- failed

---

## 3. Invoices Panel

### Função

Exibir notas fiscais geradas.

### Features

- status de emissão
- link simulado de download
- relação com payment

---

### Estados

- requested
- issued
- failed

---

## 4. Timeline Stream

### Função

Mostrar tudo que acontece no sistema.

### Características

- lista em tempo real
- ordenação por timestamp
- agrupamento por correlationId

---

### Exemplo visual

```text id="dash_timeline1"
[12:01] charge.created
[12:01] payment.created
[12:02] payment.approved
[12:02] invoice.issued
[12:02] notification.sent
```

---

## 5. Notifications Panel

### Função

Exibir alertas do sistema.

### Tipo de notificações

- sucesso
- erro
- info
- warning

---

### Comportamento

- atualiza via SSE
- desaparece após leitura
- histórico acessível

---

# Fluxo do usuário

```text id="dash_flow1"
Login

↓

Dashboard

↓

Cria Charge

↓

Payment simulado inicia

↓

Timeline começa a atualizar

↓

Payment aprovado ou falha

↓

Invoice gerada

↓

Notificação exibida
```

---

# Atualização em tempo real

## SSE como motor principal

```text id="dash_sse1"
Backend Event → SSE Stream → Store → UI Reactiva
```

---

## O que atualiza automaticamente:

- status de charge
- status de payment
- emissão de invoice
- timeline
- notificações

---

# Estados globais do dashboard

## Store principal

```ts id="dash_store1"
type DashboardState = {
  charges: Charge[];
  payments: Payment[];
  invoices: Invoice[];
  timeline: TimelineEvent[];
  notifications: Notification[];
};
```

---

# Interações principais

## Criar Charge

```text id="dash_int1"
User → Form → API → Backend → Event → UI update
```

---

## Simular pagamento

```text id="dash_int2"
Charge → Payment → Simulator → Result → Timeline + Notification
```

---

# UX Principles

- tudo é em tempo real
- nenhuma ação exige refresh
- feedback imediato sempre
- sistema sempre “vivo”
- estado sempre visível

---

# Componentização

## Componentes principais

- ChargesTable
- PaymentsList
- InvoiceCard
- TimelineFeed
- NotificationToast
- StatusBadge

---

# Design mental do sistema

> O usuário não navega entre páginas — ele observa um sistema vivo.

---

# Performance

- updates incrementais
- renderização leve
- estado mínimo
- streams controlados via SSE

---

# Benefícios

- experiência realista de sistema financeiro
- visualização completa de eventos
- debugging fácil via UI
- aprendizado de arquitetura event-driven

---

# Resultado esperado

Com esse dashboard teremos:

- visão completa do sistema
- rastreabilidade visual
- interação em tempo real
- simulação de produção real

---

# Próximo documento

```
state-management.md
```

Aqui vamos definir como o estado será gerenciado no frontend (Pinia), incluindo padrões para SSE e sincronização com backend.
```