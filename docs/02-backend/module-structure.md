# Module Structure

## Visão Geral

Este documento define a estrutura padrão de todos os módulos do backend do Payment Flow.

O objetivo é garantir consistência, escalabilidade e separação clara de responsabilidades.

---

# Estrutura padrão de um módulo

Cada módulo segue exatamente este padrão:

```text id="mod_tree1"
modules/
  charges/
    domain/
    application/
    infrastructure/
    presentation/
    charges.module.ts
```

---

# Responsabilidade de cada camada

## Domain

Contém regras puras de negócio.

Inclui:

- entidades
- value objects
- eventos de domínio
- regras invariantes

❌ NÃO depende de NestJS

---

## Application

Camada de orquestração.

Inclui:

- use cases
- fluxos de negócio
- coordenação entre domínio e infraestrutura

❌ NÃO acessa diretamente frameworks

---

## Infrastructure

Camada técnica.

Inclui:

- MongoDB repositories
- RabbitMQ publishers/consumers
- integrações externas

---

## Presentation

Camada de entrada.

Inclui:

- REST controllers
- GraphQL resolvers
- SSE gateways
- DTOs

---

# Exemplo real: Charges Module

```text id="mod_charges1"
charges/
  domain/
    entities/
      charge.entity.ts
    events/
      charge-created.event.ts

  application/
    use-cases/
      create-charge.usecase.ts
      cancel-charge.usecase.ts

  infrastructure/
    persistence/
      mongo/
        charge.repository.ts
    messaging/
      charge.publisher.ts

  presentation/
    http/
      charges.controller.ts
    dtos/
      create-charge.dto.ts

  charges.module.ts
```

---

# Fluxo interno do módulo

```text id="mod_flow1"
Controller
  ↓
Use Case
  ↓
Domain Entity
  ↓
Repository Interface
  ↓
Infrastructure (MongoDB)
  ↓
Event Publisher (RabbitMQ)
```

---

# Regras de isolamento

## Domain não pode:

- importar NestJS
- acessar MongoDB
- usar RabbitMQ
- depender de DTOs

---

## Application não pode:

- depender de framework
- conter lógica de infraestrutura
- conter código de controller

---

## Infrastructure pode:

- acessar banco
- publicar eventos
- chamar APIs externas

---

## Presentation pode:

- validar input (DTO)
- chamar use cases
- formatar resposta

---

# Shared Layer

Existe uma camada compartilhada:

```text id="mod_shared1"
shared/
  domain/
  events/
  utils/
  decorators/
```

---

# Repositórios

Cada módulo define:

- interface no domain
- implementação na infrastructure

Exemplo:

```ts id="mod_repo1"
export interface ChargesRepository {
  create(charge: Charge): Promise<void>;
  findById(id: string): Promise<Charge>;
}
```

---

# Use Case padrão

```ts id="mod_uc1"
export class CreateChargeUseCase {
  constructor(private repo: ChargesRepository) {}

  async execute(input: CreateChargeInput) {
    const charge = new Charge(input);

    await this.repo.create(charge);

    charge.emit('charge.created');

    return charge;
  }
}
```

---

# Eventos dentro do módulo

- Domain Events → internos
- Integration Events → RabbitMQ

---

# Boas práticas

- Um módulo não conhece outro diretamente
- Comunicação sempre via eventos
- Use cases são sempre pequenos
- Domain é independente de tudo
- Infrastructure é substituível

---

# Benefícios dessa estrutura

- fácil manutenção
- escalável para microservices
- testável isoladamente
- clara separação de responsabilidades
- reduz acoplamento

---

# Resultado esperado

Com essa estrutura, cada módulo do Payment Flow será:

- independente
- testável
- extensível
- pronto para escala

---

# Próximo documento

```
repositories.md
```

Aqui vamos detalhar como o padrão de persistência com MongoDB será implementado corretamente dentro dessa arquitetura.
```