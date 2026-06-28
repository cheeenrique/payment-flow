# Invoices Module

## Visão Geral

O módulo **Invoices** é responsável pela simulação de emissão de notas fiscais dentro do Payment Flow.

Ele representa o estágio final de um pagamento aprovado, fechando o ciclo financeiro da cobrança.

---

# Responsabilidade do módulo

O Invoices Module é responsável por:

- Criar solicitações de emissão de nota fiscal
- Simular processamento fiscal
- Gerar invoice vinculada a um payment aprovado
- Controlar status da emissão
- Disponibilizar documento final (simulado)

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Processamento de pagamentos
- Criação de cobranças
- Gestão de clientes
- Emissão fiscal real (SEFAZ / governo)
- Validação tributária real

---

# Entidade principal

## Invoice

Representa a nota fiscal gerada após um pagamento aprovado.

### Campos:

- id
- paymentId
- chargeId
- customerId
- amount
- status
- issuedAt
- externalReference (simulado)
- createdAt
- updatedAt

---

# Estados da Invoice

- requested
- processing
- issued
- failed

---

# Fluxo principal

## Geração de invoice

```text id="inv_flow1"
Payment aprovado

↓

Evento:
payment.approved

↓

Invoices Module escuta evento

↓

Cria invoice com status "requested"

↓

Simula processamento fiscal

↓

Resultado:

   ├── issued
   └── failed
```

---

# Processamento simulado

## Emissão de nota fiscal

```text id="inv_flow2"
Invoice criada

↓

Worker inicia processamento

↓

Simulação de delay (ex: 1–3 min)

↓

Validação simulada

↓

Resultado:

   - issued → sucesso
   - failed → erro fiscal simulado
```

---

# Endpoints (REST - Command Side)

## POST /invoices/request

Solicita emissão manual (caso necessário).

---

## GET /invoices/:id

Consulta invoice.

---

## GET /payments/:id/invoice

Busca invoice de um pagamento.

---

# Persistência (MongoDB)

## Collection: invoices

```json id="inv_db1"
{
  "_id": "ObjectId",
  "paymentId": "ObjectId",
  "chargeId": "ObjectId",
  "customerId": "ObjectId",
  "amount": 100.00,
  "status": "issued",
  "externalReference": "NF-123456",
  "issuedAt": "date",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

# Eventos de domínio

## Eventos gerados

- invoice.requested
- invoice.processing
- invoice.issued
- invoice.failed

---

## Consumo de eventos

### Payments Module

- payment.approved → dispara invoice.requested

---

### Timeline Module

- registra todo ciclo de emissão

---

### Notifications Module

- notifica cliente sobre emissão

---

### Dashboard

- atualiza status em tempo real

---

# Integração com arquitetura

## RabbitMQ

Invoices funciona de forma assíncrona:

- consome payment.approved
- publica invoice.* events

---

## SSE

Atualiza dashboard em tempo real:

- invoice requested
- invoice issued
- invoice failed

---

# Regras de negócio

- Invoice só pode ser criada se payment estiver aprovado
- Cada payment gera no máximo 1 invoice
- Invoice não pode ser alterada após emissão
- Falha na emissão não bloqueia sistema de pagamentos
- Reprocessamento pode ser permitido via simulator

---

# Integração com Payments

```text id="inv_rel1"
Payment (approved)
    ↓
Invoice (created)
    ↓
Invoice issued or failed
```

---

# Importância no sistema

Invoices representam o **fechamento financeiro da operação**.

Sem invoice, o ciclo de pagamento é considerado incompleto.

---

# Resultado esperado

Ao final deste módulo teremos:

- ciclo financeiro completo funcionando
- integração event-driven entre payments e invoices
- simulação de emissão fiscal realista
- base para relatórios e auditoria

---

# Próximo módulo

```
notifications.md
```

Aqui vamos centralizar todas as notificações do sistema em tempo real e assíncronas.
```