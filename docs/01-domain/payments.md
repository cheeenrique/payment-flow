# Payments Module

## Visão Geral

O módulo **Payments** é responsável pelo processamento de pagamentos dentro do Payment Flow.

Ele representa a tentativa real de pagamento de uma Charge.

Cada Charge pode gerar um ou mais Payments ao longo do seu ciclo de vida.

---

# Responsabilidade do módulo

O Payments Module é responsável por:

- Criar tentativas de pagamento
- Processar pagamentos
- Simular métodos de pagamento (PIX, boleto, cartão)
- Gerenciar status de pagamento
- Emitir eventos de resultado
- Encaminhar fluxo para Invoice (quando aprovado)

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Criação de cobranças (Charges)
- Gestão de clientes (Customers)
- Emissão de notas fiscais (Invoices)
- Notificações (Notifications)
- Autenticação (Auth)

---

# Entidade principal

## Payment

Representa uma tentativa de pagamento de uma charge.

### Campos:

- id
- chargeId
- customerId
- amount
- method (pix | boleto | credit_card)
- status
- providerResponse
- failureReason
- createdAt
- updatedAt

---

# Estados do Payment

## Ciclo de vida

- pending
- processing
- approved
- failed
- expired

---

# Fluxo principal

## Criação e processamento

```text id="pay_flow1"
Charge é criada

↓

Charge emite evento:
charge.payment_requested

↓

Payments Module recebe evento

↓

Payment é criado com status "pending"

↓

Inicia processamento

↓

Simulação do método de pagamento

↓

Resultado definido:

   ├── approved
   ├── failed
   └── expired
```

---

# Processamento por método

## PIX

```text id="pay_flow_pix"
Pagamento iniciado

↓

Simulação de aprovação quase instantânea

↓

Pode:

- Aprovar imediatamente
- Expirar após timeout
- Falhar por simulação

↓

Evento:
payment.approved | payment.failed | payment.expired
```

---

## Boleto

```text id="pay_flow_boleto"
Pagamento iniciado

↓

Entra em fila de processamento

↓

Delay simulado (ex: 5 minutos)

↓

Worker processa compensação

↓

Baixa automática:

- approved (quando compensado)
- expired (se não pago)
```

---

## Cartão de Crédito

```text id="pay_flow_card"
Pagamento iniciado

↓

Validação simulada

↓

Regras de aprovação:

- saldo simulado
- risco simulado
- taxa de aprovação configurável

↓

Resultado:

- approved
- failed (com motivo)
```

---

# Endpoints (REST - Command Side)

## POST /payments

Cria um pagamento manualmente (caso necessário).

### Input:

- chargeId
- method

---

## GET /payments/:id

Consulta pagamento.

---

## GET /charges/:id/payments

Lista pagamentos de uma cobrança.

---

# Persistência (MongoDB)

## Collection: payments

```json id="pay_db1"
{
  "_id": "ObjectId",
  "chargeId": "ObjectId",
  "customerId": "ObjectId",
  "amount": 100.00,
  "method": "pix",
  "status": "approved",
  "providerResponse": {},
  "failureReason": null,
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

# Eventos de domínio

## Eventos gerados

- payment.created
- payment.processing
- payment.approved
- payment.failed
- payment.expired

---

## Integrações

### Charges

- inicia payment automaticamente

### Invoices

- payment.approved → gera invoice

### Timeline

- registra todos os eventos

### Notifications

- envia status de pagamento

---

## RabbitMQ

Payments é altamente dependente de eventos:

- consume charge.payment_requested
- emits payment.* events

---

## SSE

Atualizações em tempo real:

- início do pagamento
- mudança de status
- finalização

---

# Regras de negócio

- Um Payment sempre pertence a uma Charge
- Não pode existir Payment sem Charge
- Apenas um Payment pode ser "active" por vez por Charge (regra futura opcional)
- Payment aprovado não pode ser alterado
- Payment expirado não pode ser reprocessado

---

# Integração com Simulator

O Simulator pode interferir diretamente:

- forçar aprovação
- forçar falha
- simular delay
- simular timeout
- simular instabilidade

---

# Importância no sistema

Payments é o **motor de execução do sistema**.

Se Charges são o “pedido”, Payments são a “execução”.

---

# Resultado esperado

Ao final deste módulo teremos:

- processamento completo de pagamentos
- simulação realista de métodos financeiros
- base para emissão de invoice
- fluxo event-driven completo funcionando

---

# Próximo módulo

```
invoices.md
```

Aqui começaremos a simular emissão de nota fiscal após pagamentos aprovados.
```