# Charges Module

## Visão Geral

O módulo **Charges** é o núcleo do sistema Payment Flow.

Ele representa a criação e gestão de cobranças, sendo o ponto de partida de todo fluxo de pagamento.

Toda cobrança está associada a um Customer e pode gerar um ou mais Payments.

---

# Responsabilidade do módulo

O Charges Module é responsável por:

- Criar cobranças
- Cancelar cobranças
- Consultar status de cobranças
- Controlar ciclo de vida da cobrança
- Emitir eventos de domínio
- Iniciar fluxo de pagamento

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Processamento de pagamento (Payments)
- Emissão de nota fiscal (Invoices)
- Comunicação com cliente (Notifications)
- Autenticação (Auth)
- Gestão de clientes (Customers)

---

# Entidade principal

## Charge

Representa uma cobrança criada no sistema.

### Campos:

- id
- customerId
- amount
- currency
- description
- status
- paymentMethod (pix | boleto | credit_card)
- expiresAt
- createdAt
- updatedAt

---

# Ciclo de vida da Charge

## Estados possíveis

- pending
- awaiting_payment
- paid
- canceled
- expired
- failed

---

## Fluxo completo

```text id="chg_flow1"
Customer solicita cobrança

↓

Charge é criada com status "pending"

↓

Charge é ativada → "awaiting_payment"

↓

Sistema aguarda pagamento

↓

Pagamento pode ocorrer (PIX / boleto / cartão)

↓

Charge é atualizada conforme resultado

↓

Fluxo finaliza:
   - paid
   - canceled
   - expired
   - failed
```

---

# Criação de Charge

```text id="chg_flow2"
Request (REST)

↓

Validação de customer

↓

Validação de valor

↓

Criação da charge

↓

Persistência no MongoDB

↓

Evento: charge.created

↓

RabbitMQ publica evento

↓

Timeline registra evento

↓

SSE notifica dashboard
```

---

# Cancelamento de Charge

```text id="chg_flow3"
Request de cancelamento

↓

Verificação de status

↓

Se permitido:

   → status = canceled

↓

Evento emitido:
   charge.canceled

↓

Timeline atualizada

↓

Dashboard notificado via SSE
```

---

# Expiração de Charge

```text id="chg_flow4"
Scheduler ou Simulator

↓

Verifica charges vencidas

↓

Atualiza status para expired

↓

Evento emitido:
   charge.expired

↓

Propagação via RabbitMQ

↓

Timeline + Dashboard atualizados
```

---

# Endpoints (REST - Command Side)

## POST /charges

Cria uma cobrança.

### Input:

- customerId
- amount
- description
- paymentMethod
- expiresAt

---

## GET /charges

Lista cobranças.

---

## GET /charges/:id

Detalhe da cobrança.

---

## POST /charges/:id/cancel

Cancela cobrança.

---

# Persistência (MongoDB)

## Collection: charges

```json id="chg_db1"
{
  "_id": "ObjectId",
  "customerId": "ObjectId",
  "amount": 150.00,
  "currency": "BRL",
  "description": "Curso NestJS",
  "status": "awaiting_payment",
  "paymentMethod": "pix",
  "expiresAt": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

# Eventos de domínio

## Eventos gerados

- charge.created
- charge.updated
- charge.canceled
- charge.expired
- charge.payment_requested

---

## Consumo dos eventos

- Payments Module → inicia pagamento
- Timeline → registra histórico
- Notifications → envia alertas
- Dashboard → atualiza UI

---

# Integração com Payments

## Relação principal

```text id="chg_rel1"
Charge (1)
   └── Payments (N)
```

Uma Charge pode gerar múltiplas tentativas de pagamento.

---

## Início do fluxo de pagamento

Quando uma charge é criada:

```text id="chg_flow5"
charge.created

↓

Payments Module é acionado

↓

Payment é criado automaticamente

↓

Processamento inicia
```

---

# Regras de negócio

- Charge deve sempre ter um Customer válido
- Charge expira automaticamente após expiresAt
- Charge cancelada não pode ser paga
- Charge paga não pode ser alterada
- Cada charge deve ter um método de pagamento definido

---

# Integração com arquitetura

## REST

Responsável por comandos de criação e cancelamento

---

## RabbitMQ

Distribui eventos para:

- Payments
- Timeline
- Notifications

---

## SSE

Atualiza dashboard em tempo real:

- criação
- pagamento
- cancelamento
- expiração

---

## Simulator

Pode interferir diretamente no estado da charge:

- forçar expiração
- simular cancelamento
- disparar eventos de pagamento

---

# Importância no sistema

Charge é o **coração do fluxo de pagamento**.

Tudo no sistema acontece a partir dela.

---

# Resultado esperado

Ao final deste módulo teremos:

- ciclo completo de cobrança
- base para processamento de pagamentos
- integração total com eventos
- início do fluxo real do sistema

---

# Próximo módulo

```
payments.md
```

Aqui começaremos o processamento real de pagamentos (PIX, boleto e cartão).
```