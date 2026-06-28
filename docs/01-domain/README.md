# Domain Model

## Visão Geral

Esta seção define todo o modelo de domínio do **Payment Flow**.

Aqui estão descritas as entidades centrais do sistema, seus comportamentos e como elas se relacionam.

O objetivo é traduzir o conceito de “gateway de pagamentos simulado” em um modelo estruturado e consistente.

---

# Objetivo desta seção

O Domain Model tem como objetivo:

- Definir as entidades do sistema
- Explicar suas responsabilidades
- Mapear seus relacionamentos
- Padronizar linguagem do domínio
- Servir como base para implementação no backend

---

# Princípios do Domínio

## 1. Linguagem única

Os nomes usados aqui devem ser refletidos diretamente no código.

Exemplo:

- Charge
- Payment
- Customer
- Invoice

---

## 2. Independência de infraestrutura

O domínio não conhece:

- Banco de dados
- Framework (NestJS)
- Mensageria (RabbitMQ)
- HTTP / GraphQL / SSE

---

## 3. Orientação a eventos

O domínio é baseado em eventos.

Cada mudança relevante de estado gera um evento.

---

## 4. Imutabilidade de eventos

Eventos não podem ser alterados após criação.

---

# Entidades do Sistema

## Auth

Responsável por autenticação e identidade do usuário do sistema.

Inclui:

- login
- refresh token
- sessão
- autorização

---

## Customer

Representa o cliente que realiza pagamentos.

Responsável por:

- armazenar dados do cliente
- histórico de cobranças
- identificação no sistema

---

## Charge

Entidade central do sistema.

Representa uma cobrança criada para um cliente.

É o ponto de partida do fluxo de pagamento.

---

## Payment

Representa a tentativa de pagamento de uma charge.

Cada charge pode ter múltiplos payments dependendo do fluxo.

---

## Invoice

Representa a nota fiscal gerada após um pagamento aprovado.

No sistema é simulada, mas segue fluxo realista.

---

## Notification

Responsável por eventos de notificação do sistema.

Exemplo:

- pagamento aprovado
- cobrança criada
- invoice disponível

---

## Timeline

Representa o histórico completo de eventos de uma charge.

Permite rastrear todo o fluxo do pagamento.

---

## Simulator

Módulo responsável por simular comportamentos reais do sistema.

Exemplo:

- delay de pagamento
- falha de cartão
- compensação de boleto
- expiração de PIX

---

# Relação entre entidades

```text id="rel1"
Customer
   │
   ▼
Charge
   │
   ├── Payment
   │       └── status (approved | failed | pending)
   │
   ├── Invoice
   │
   └── Timeline (events)
```

---

# Fluxo principal do domínio

```text id="flow1"
Customer cria Charge

↓

Charge gera Payment

↓

Payment é processado

↓

Evento é emitido

↓

RabbitMQ propaga evento

↓

Invoice pode ser gerada

↓

Timeline registra tudo

↓

SSE atualiza dashboard
```

---

# Eventos principais do domínio

- charge.created
- payment.started
- payment.approved
- payment.failed
- invoice.requested
- invoice.generated
- charge.expired

---

# Regras gerais

- Toda charge deve ter um customer
- Todo payment pertence a uma charge
- Invoice só existe para payments aprovados
- Timeline registra tudo sem exceção
- Simulator pode interferir em qualquer etapa

---

# Resultado esperado

Ao final desta modelagem:

- o sistema terá um domínio claro e consistente
- todas as features derivarão daqui
- o backend será implementado sem ambiguidade
- eventos serão previsíveis e rastreáveis

---

# Próximo passo

Agora que o domínio está definido, seguimos para:

```
auth.md
```

onde será detalhado o primeiro módulo funcional do sistema.
```