# Testing Strategy

## Visão Geral

Este documento define a estratégia de testes do Payment Flow.

O objetivo é garantir confiabilidade em um sistema altamente orientado a eventos e com múltiplas integrações.

---

# Pirâmide de testes

O projeto segue a pirâmide clássica:

```text id="test_pyramid1"
E2E (menos)
Integration
Unit (mais)
```

---

# Tipos de teste

## 1. Unit Tests

Testam lógica isolada.

### Onde:

- Domain
- Use Cases

### O que validar:

- regras de negócio
- cálculos
- estados de entidades
- eventos gerados

---

## Exemplo

```ts id="test_unit1"
describe('CreateChargeUseCase', () => {
  it('should create a charge', async () => {
    const result = await useCase.execute(input);

    expect(result).toBeDefined();
  });
});
```

---

# 2. Integration Tests

Testam integração entre camadas.

### Onde:

- Use Cases + Repository
- Event Publisher + Consumer
- MongoDB

### O que validar:

- persistência real
- publicação de eventos
- consumo de eventos

---

## Exemplo

```text id="test_int1"
Create Charge → salva no Mongo → emite evento → consumer processa
```

---

# 3. E2E Tests

Testam fluxo completo do sistema.

### Onde:

- HTTP API
- GraphQL
- SSE

---

## Exemplo

```text id="test_e2e1"
POST /charges
  ↓
POST /payments
  ↓
payment.approved
  ↓
invoice.issued
  ↓
timeline updated
```

---

# Estratégia para eventos

## Problema

Sistema é altamente assíncrono.

---

## Solução

### 1. Await event completion

Testes esperam eventos finalizarem.

---

### 2. Mock RabbitMQ (unit/integration)

- simula eventos
- controla fluxo

---

### 3. Test container (integration real)

- RabbitMQ real via Docker
- MongoDB real via Docker

---

# Testes de domínio

## Regra importante

Domain deve ser 100% testável sem infraestrutura.

---

## Exemplo

```ts id="test_domain1"
it('should not allow expired charge to be paid', () => {
  expect(() => charge.pay())
    .toThrow('Charge expired');
});
```

---

# Testes de Use Cases

## Foco

- orquestração
- integração com repos
- eventos emitidos

---

## Exemplo

```ts id="test_uc1"
it('should emit charge.created event', async () => {
  await useCase.execute(input);

  expect(eventBus.emit).toHaveBeenCalled();
});
```

---

# Testes de Repositório

## Foco

- persistência real
- MongoDB behavior

---

## Estratégia

- usar MongoDB in-memory ou test container

---

# Testes de eventos

## Foco

- publicação correta
- consumo correto
- idempotência

---

## Exemplo

```ts id="test_evt1"
it('should process payment.approved event', async () => {
  await consumer.handle(event);

  expect(invoiceCreated).toBe(true);
});
```

---

# Testes de SSE

## Foco

- streaming de eventos
- atualização em tempo real

---

# Mocking strategy

## O que pode ser mockado

- RabbitMQ
- APIs externas
- clocks (tempo simulado)

---

## O que NÃO deve ser mockado

- domain logic
- use cases
- regras de negócio

---

# Test containers (recomendado)

Usar Docker para:

- MongoDB
- RabbitMQ

---

## Exemplo

```text id="test_docker1"
docker-compose.test.yml

- mongo
- rabbitmq
```

---

# Idempotência em testes

Testes devem garantir:

```text id="test_idem1"
mesmo evento não gera duplicação de efeito
```

---

# Coverage strategy

## Meta

- Domain: 100%
- Use Cases: 90%+
- Infrastructure: 70%+
- E2E: fluxo crítico

---

# Boas práticas

- testes isolados
- sem dependência entre testes
- seed controlado
- clock controlado
- eventos previsíveis

---

# Estratégia geral

## Regra principal

> Se quebra fluxo de pagamento → deve ter teste

---

# Resultado esperado

Com essa estratégia:

- sistema confiável
- arquitetura validada por testes
- eventos previsíveis
- regressões reduzidas
- evolução segura

---

# Conclusão do backend

Com isso finalizamos:

```
02-backend/
```

Agora temos:

- arquitetura completa NestJS
- eventos distribuídos
- validação e erros padronizados
- autenticação segura
- persistência com MongoDB
- testes completos

---

# Próximo passo

```
03-frontend/
```

Aqui vamos definir:

- Vue 3 (ou alternativa)
- dashboard do payment-flow
- consumo de SSE
- integração GraphQL/REST
- visualização de timeline e pagamentos
```