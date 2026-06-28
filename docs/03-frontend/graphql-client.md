# GraphQL Client

## Visão Geral

Este documento define como o frontend do Payment Flow utiliza GraphQL.

O objetivo é permitir consultas avançadas e agregadas para dashboards e relatórios.

---

# Princípio principal

> GraphQL não é usado para tempo real — apenas para leitura estruturada.

---

# Uso no sistema

GraphQL será usado para:

- dashboards agregados
- relatórios financeiros
- consultas complexas
- filtros avançados
- visão consolidada de dados

---

# Comparação com outras camadas

| Tecnologia | Uso |
|------------|-----|
| REST | comandos (write) |
| SSE | tempo real |
| GraphQL | leitura complexa |

---

# Estrutura do cliente

## Apollo Client (recomendado)

```ts id="gql_client1"
import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: '/graphql',
  cache: new InMemoryCache(),
});
```

---

# Exemplo de query

## Dashboard overview

```graphql id="gql_query1"
query DashboardSummary {
  charges {
    total
    pending
    paid
    expired
  }

  payments {
    total
    approved
    failed
  }

  invoices {
    issued
    failed
  }
}
```

---

# Uso no frontend

```ts id="gql_use1"
const { data } = useQuery(DASHBOARD_SUMMARY);
```

---

# Casos de uso reais

---

## 1. Resumo financeiro

- total de charges
- total de payments
- taxa de aprovação

---

## 2. Análise de performance

- tempo médio de pagamento
- taxa de falha por método

---

## 3. Filtros avançados

- por cliente
- por período
- por status

---

# Estrutura de schema esperada (backend)

```graphql id="gql_schema1"
type Query {
  dashboard: DashboardSummary
  charges(filter: ChargeFilter): [Charge]
  payments(filter: PaymentFilter): [Payment]
}
```

---

# Integração com SSE

## Regra importante

GraphQL NÃO substitui SSE.

---

## Fluxo combinado

```text id="gql_flow1"
GraphQL → load inicial

SSE → atualizações contínuas

Pinia → estado final
```

---

# Cache strategy

Apollo Client:

- cache-first para dashboard
- network-only para dados críticos

---

# Benefícios

- consultas flexíveis
- menos endpoints REST
- agregações poderosas
- ideal para dashboards

---

# Limitações

- não usado para tempo real
- não substitui SSE
- não usado para ações de escrita

---

# Boas práticas

- manter queries pequenas
- evitar over-fetching
- usar fragments
- cache controlado
- separar queries por domínio

---

# Exemplo de fragmento

```graphql id="gql_frag1"
fragment ChargeFields on Charge {
  id
  amount
  status
  createdAt
}
```

---

# Resultado esperado

Com GraphQL teremos:

- dashboards inteligentes
- consultas otimizadas
- redução de endpoints REST
- visão agregada do sistema

---

# Próximo documento

```
components.md
```

Aqui vamos definir a biblioteca de componentes UI do dashboard (tabelas, cards, timeline, notificações, etc).
```