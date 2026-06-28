# Notifications Module

## Visão Geral

O módulo **Notifications** é responsável por centralizar e gerenciar todas as notificações geradas pelo sistema Payment Flow.

Ele atua como um agregador de eventos relevantes do sistema e os transforma em notificações para o usuário final.

---

# Responsabilidade do módulo

O Notifications Module é responsável por:

- Receber eventos do sistema
- Transformar eventos em notificações
- Persistir histórico de notificações
- Enviar notificações em tempo real (SSE)
- Disponibilizar notificações para consulta

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Processamento de pagamentos
- Criação de cobranças
- Emissão de invoice
- Autenticação
- Lógica de domínio de pagamento

---

# Entidade principal

## Notification

Representa uma notificação gerada pelo sistema.

### Campos:

- id
- type (info | success | warning | error)
- eventType (ex: payment.approved)
- title
- message
- userId (opcional)
- customerId (opcional)
- read
- createdAt

---

# Tipos de notificações

## Informativas

- charge.created
- invoice.requested

## Sucesso

- payment.approved
- invoice.issued

## Erro

- payment.failed
- invoice.failed

## Avisos

- charge.expired
- payment.expiring_soon

---

# Fluxo principal

## Geração de notificação

```text id="ntf_flow1"
Evento é emitido no sistema

↓

RabbitMQ publica evento

↓

Notifications Module consome evento

↓

Evento é transformado em Notification

↓

Notificação é salva no MongoDB

↓

Notificação enviada via SSE

↓

Frontend atualiza dashboard
```

---

# Endpoints (REST - Query Side)

## GET /notifications

Lista notificações do usuário/sistema.

---

## GET /notifications/:id

Busca notificação específica.

---

## PATCH /notifications/:id/read

Marca notificação como lida.

---

# Persistência (MongoDB)

## Collection: notifications

```json id="ntf_db1"
{
  "_id": "ObjectId",
  "type": "success",
  "eventType": "payment.approved",
  "title": "Pagamento aprovado",
  "message": "Seu pagamento foi processado com sucesso.",
  "customerId": "ObjectId",
  "read": false,
  "createdAt": "date"
}
```

---

# Eventos consumidos

Notifications escuta eventos de:

- Charges
- Payments
- Invoices
- System Simulator

---

## Exemplos:

- charge.created
- charge.expired
- payment.approved
- payment.failed
- invoice.issued
- invoice.failed

---

# Integração com arquitetura

## RabbitMQ

Notifications atua como consumer global:

- escuta múltiplos tópicos
- transforma eventos em notificações

---

## SSE

Notificações são enviadas em tempo real:

- nova notificação
- mudança de status (read/unread)

---

## GraphQL (futuro)

Permite consultas avançadas:

- histórico de notificações
- filtros por tipo
- agrupamento por cliente

---

# Regras de negócio

- Toda notificação deve ter um eventType
- Notificação pode ser global ou por cliente
- Notificações não podem ser alteradas após criação (exceto read/unread)
- Notificações antigas podem ser arquivadas (futuro)

---

# Relação com outros módulos

```text id="ntf_rel1"
Payments → Notifications
Charges → Notifications
Invoices → Notifications
Simulator → Notifications
```

---

# Importância no sistema

Notifications são o **canal de comunicação do sistema com o usuário**.

Sem ele, o sistema seria “cego” para o usuário final.

---

# Resultado esperado

Ao final deste módulo teremos:

- sistema de notificações centralizado
- integração completa com eventos
- comunicação em tempo real via SSE
- histórico persistente de eventos importantes

---

# Próximo módulo

```
timeline.md
```

Aqui vamos montar o histórico completo e rastreável de tudo que acontece no sistema.
```