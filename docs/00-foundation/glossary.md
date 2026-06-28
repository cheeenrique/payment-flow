# Glossary

## Visão Geral

Este documento define os principais termos utilizados no **Payment Flow**.

Ele existe para garantir consistência na linguagem entre código, documentação e arquitetura.

Todos os termos aqui descritos devem ser usados de forma padronizada em todo o sistema.

---

# Domínio Principal

## Charge (Cobrança)

Entidade que representa uma solicitação de pagamento.

Uma charge é criada antes de qualquer pagamento ser iniciado.

Pode conter:

- valor
- cliente
- método de pagamento
- status
- histórico de eventos

---

## Payment (Pagamento)

Representa a tentativa de pagamento de uma charge.

Um payment pode:

- ser aprovado
- ser recusado
- estar pendente
- expirar

Cada tentativa gera eventos no sistema.

---

## Customer (Cliente)

Entidade que representa o usuário que realiza pagamentos.

Contém informações básicas como:

- nome
- e-mail
- documento
- histórico de cobranças

---

## Invoice (Nota Fiscal)

Documento gerado após a confirmação de um pagamento.

No sistema é simulado, mas segue o fluxo real:

- solicitação
- processamento
- emissão
- disponibilidade

---

# Eventos

## Event (Evento)

Registro imutável de algo que aconteceu no sistema.

Exemplo:

- payment.approved
- payment.failed
- charge.created

Eventos são a base da arquitetura do sistema.

---

## Domain Event

Evento gerado dentro do domínio.

Exemplo:

- PaymentApproved
- ChargeCreated

---

## Integration Event

Evento usado para comunicação entre módulos via RabbitMQ.

Exemplo:

- payment.approved.v1
- invoice.requested.v1

---

# Mensageria

## Producer

Componente responsável por publicar eventos no RabbitMQ.

---

## Consumer

Componente responsável por consumir eventos do RabbitMQ.

---

## Queue (Fila)

Estrutura onde eventos ficam armazenados até serem processados.

---

## Exchange

Componente do RabbitMQ responsável por rotear mensagens para filas.

---

## Routing Key

Chave usada para definir o destino de um evento no broker.

---

## DLQ (Dead Letter Queue)

Fila onde mensagens com erro são enviadas após falhas de processamento.

---

## Retry

Mecanismo de reprocessamento automático de eventos falhos.

---

# Arquitetura

## Projection (Projeção)

Modelo otimizado para leitura.

No Payment Flow, projections são usadas para:

- dashboard
- relatórios
- consultas GraphQL

---

## Read Model

Estrutura de dados otimizada para leitura, separada do modelo de escrita.

---

## Command

Ação que modifica estado do sistema.

Exemplo:

- criar cobrança
- iniciar pagamento
- cancelar cobrança

---

## Query

Ação que apenas lê dados sem modificar estado.

---

## CQRS

Padrão que separa comandos (write) de consultas (read).

No Payment Flow é aplicado de forma pragmática.

---

# Pagamentos

## PIX

Método de pagamento instantâneo simulado.

Pode:

- aprovar rapidamente
- expirar
- falhar por simulação

---

## Boleto

Método de pagamento com compensação atrasada.

No sistema:

- possui delay simulado
- processamento assíncrono
- baixa automática via worker

---

## Cartão de Crédito

Método de pagamento com aprovação síncrona simulada.

Pode:

- aprovar
- recusar
- retornar motivo de falha

---

# Tempo Real

## SSE (Server-Sent Events)

Canal de comunicação unidirecional do backend para frontend.

Usado para:

- atualizar dashboard
- notificar mudanças
- atualizar timeline

---

# Sistema

## Timeline

Registro cronológico de eventos do sistema.

Permite visualizar o fluxo completo de uma cobrança.

---

## Simulator

Módulo responsável por simular comportamento real do sistema.

Pode:

- atrasar pagamentos
- gerar falhas
- simular aprovação
- disparar eventos automaticamente

---

# Erros e Resiliência

## Retry

Tentativa automática de reprocessar uma operação falha.

---

## Idempotência

Garantia de que uma operação não será executada mais de uma vez.

---

## Timeout

Tempo máximo para uma operação ser considerada falha.

---

# Identificadores

## Correlation ID

Identificador usado para rastrear uma requisição através de todo o sistema.

---

## Event ID

Identificador único de cada evento.

---

## Traceability

Capacidade de rastrear todo o fluxo de uma operação do início ao fim.

---

# Regra de Ouro do Sistema

> Todo estado relevante deve ser representado por um evento.

---

# Resultado

Com este glossário, o projeto passa a ter:

- linguagem consistente
- domínio bem definido
- base para documentação futura
- referência para código e arquitetura

---

# Próximo passo

```
01-domain/
```

Aqui começaremos a modelar o sistema de verdade:

- Auth
- Customers
- Charges
- Payments
- Invoices
- Timeline
- Simulator
```