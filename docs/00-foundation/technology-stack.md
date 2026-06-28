# Technology Stack

## Visão Geral

Este documento define todas as tecnologias utilizadas no **Payment Flow**, incluindo justificativas arquiteturais e decisões de design.

A escolha de cada tecnologia foi feita com base em três critérios:

- Valor educacional
- Aderência a sistemas reais de produção
- Capacidade de demonstrar arquitetura moderna

---

# Backend

## NestJS

### Uso
Framework principal do backend.

### Por que foi escolhido

- Arquitetura modular nativa
- Suporte forte a Dependency Injection
- Excelente para Domain-Driven Design (DDD)
- Facilita separação de camadas
- Amplo uso em empresas reais

### Alternativas

- Express (muito manual)
- Fastify (baixo nível)
- Spring Boot (fora do ecossistema JS)

---

## TypeScript

### Uso
Linguagem principal do projeto.

### Por que foi escolhido

- Tipagem estática
- Melhor manutenção em projetos grandes
- Suporte nativo ao NestJS e Vue
- Reduz erros em tempo de execução

---

## MongoDB

### Uso
Banco de dados principal.

### Por que foi escolhido

- Modelo flexível orientado a documentos
- Ideal para eventos e payloads variáveis
- Escalabilidade horizontal
- Excelente para read models e projections

### Trade-offs

- Consistência eventual em alguns cenários
- Menos adequado para transações complexas tradicionais

---

## Mongoose

### Uso
ODM para MongoDB.

### Por que foi escolhido

- Integração madura com NestJS
- Suporte a schemas e validações
- Facilita abstração de persistência

---

## RabbitMQ

### Uso
Message broker para comunicação assíncrona.

### Por que foi escolhido

- Suporte a filas e pub/sub
- Alta confiabilidade
- DLQ (Dead Letter Queue) nativo
- Amplamente usado em sistemas reais

### Alternativas

- Kafka (mais complexo e voltado a streaming)
- Redis Pub/Sub (menos confiável)
- NATS (mais leve, menos comum em empresas tradicionais)

---

## GraphQL

### Uso
Camada de leitura (Query Side).

### Por que foi escolhido

- Evita over-fetching
- Ideal para dashboards
- Permite queries flexíveis
- Boa integração com Vue + Apollo

---

## REST

### Uso
Camada de comandos (Command Side).

### Por que foi escolhido

- Simplicidade
- Clareza semântica
- Amplo suporte
- Ideal para ações como criação e atualização

---

## Server-Sent Events (SSE)

### Uso
Comunicação em tempo real com o frontend.

### Por que foi escolhido

- Simples e leve
- Ideal para updates unidirecionais
- Menos complexidade que WebSockets
- Perfeito para dashboards

---

## JWT

### Uso
Autenticação e autorização.

### Por que foi escolhido

- Stateless
- Escalável
- Fácil integração com APIs

---

## Jest

### Uso
Testes automatizados.

### Por que foi escolhido

- Padrão no ecossistema NestJS
- Suporte a mocks e spies
- Fácil integração com CI

---

# Frontend

## Vue 3

### Uso
Framework principal do frontend.

### Por que foi escolhido

- Simplicidade e produtividade
- Excelente reatividade
- Curva de aprendizado rápida
- Boa integração com dashboards

---

## Vite

### Uso
Build tool do frontend.

### Por que foi escolhido

- Performance extremamente rápida
- Hot reload eficiente
- Configuração simples

---

## Pinia

### Uso
Gerenciamento de estado.

### Por que foi escolhido

- Substituto moderno do Vuex
- Simples e intuitivo
- Integração nativa com Vue 3

---

## Vue Query

### Uso
Cache e sincronização de dados.

### Por que foi escolhido

- Cache automático
- Invalidação de dados simples
- Ideal para GraphQL + REST híbrido

---

## Apollo Client

### Uso
Cliente GraphQL.

### Por que foi escolhido

- Padrão de mercado
- Cache avançado
- Integração com Vue

---

## TailwindCSS

### Uso
Estilização da interface.

### Por que foi escolhido

- Produtividade alta
- Consistência visual
- Evita CSS complexo

---

# Infraestrutura

## Docker

### Uso
Containerização da aplicação.

### Por que foi escolhido

- Ambiente padronizado
- Fácil onboarding
- Simula produção real

---

## Docker Compose

### Uso
Orquestração local.

### Por que foi escolhido

- Simplicidade para rodar todo sistema
- Ideal para desenvolvimento

---

## GitHub Actions

### Uso
CI/CD básico.

### Por que foi escolhido

- Integração nativa com GitHub
- Automação de testes e builds
- Simples e eficiente

---

# Observabilidade (futuro)

## OpenTelemetry

- Rastreamento de requisições

## Sentry

- Monitoramento de erros

## Prometheus

- Métricas

## Grafana

- Visualização de métricas

---

# Decisão arquitetural importante

O sistema foi projetado para ser:

> **Independente de framework**

Isso significa:

- Domínio não depende de NestJS
- Regras de negócio não dependem de MongoDB
- Frontend não depende de GraphQL

---

# Trade-offs principais

## MongoDB

✔ Flexível  
✔ Escalável  
❌ Menos consistente em certos cenários  

---

## RabbitMQ

✔ Confiável  
✔ Ideal para eventos  
❌ Mais complexo que Pub/Sub simples  

---

## GraphQL

✔ Flexível para leitura  
❌ Mais complexo que REST  

---

## SSE

✔ Simples e leve  
❌ Apenas unidirecional  

---

# Resultado esperado

Com essa stack, o Payment Flow será capaz de:

- Simular sistemas reais de pagamento
- Escalar arquiteturalmente
- Evoluir para microsserviços
- Demonstrar boas práticas de engenharia
- Servir como base de estudo profissional

---

# Próximo documento

```
glossary.md
```

Este documento irá definir todos os termos do domínio como:

- Charge
- Payment
- Invoice
- Event
- Consumer
- Producer
- Projection
- Retry
- DLQ
- etc
```