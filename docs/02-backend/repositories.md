# Repositories (MongoDB)

## Visão Geral

Este documento define como o padrão de **repositories** será implementado no Payment Flow usando MongoDB.

O objetivo é garantir isolamento entre o domínio e a persistência.

---

# Princípio principal

> O domínio nunca conhece MongoDB.

Toda interação com banco acontece através de interfaces.

---

# Estrutura do padrão

## Domain (interface)

```ts id="repo1_if1"
export interface ChargesRepository {
  create(charge: Charge): Promise<void>;
  findById(id: string): Promise<Charge | null>;
  update(charge: Charge): Promise<void>;
}
```

---

## Infrastructure (implementação)

```ts id="repo1_impl1"
@Injectable()
export class MongoChargesRepository implements ChargesRepository {
  constructor(
    @InjectModel(Charge.name)
    private model: Model<ChargeDocument>,
  ) {}

  async create(charge: Charge): Promise<void> {
    await this.model.create(charge);
  }

  async findById(id: string): Promise<Charge | null> {
    return this.model.findById(id).lean();
  }

  async update(charge: Charge): Promise<void> {
    await this.model.updateOne(
      { _id: charge.id },
      { $set: charge },
    );
  }
}
```

---

# Mapeamento de entidades

## Domain → Mongo Document

```text id="repo_map1"
Domain Entity (Charge)
        ↓
Mongo Document (ChargeModel)
        ↓
Collection (charges)
```

---

# Collections padrão

## customers

- dados de clientes
- status ativo/inativo

## charges

- cobranças
- ciclo de vida financeiro

## payments

- tentativas de pagamento

## invoices

- notas fiscais simuladas

## timeline_events

- auditoria completa

## notifications

- eventos de notificação

---

# Regras do repositório

## 1. Nunca retornar entidade de infra diretamente

Sempre mapear:

```text id="repo_rule1"
Mongo Document → Domain Entity
```

---

## 2. Não expor Mongoose no domínio

O domínio não conhece:

- Model
- Schema
- Document
- Lean()
- populate()

---

## 3. Repositório é contrato

Interface define comportamento, não implementação.

---

# Padrão de Model (Mongoose)

```ts id="repo_model1"
@Schema({ timestamps: true })
export class ChargeModel {
  @Prop()
  customerId: string;

  @Prop()
  amount: number;

  @Prop()
  status: string;
}
```

---

# Mapeamento manual (importante)

## Infra → Domain

```ts id="repo_map2"
private toDomain(doc: ChargeDocument): Charge {
  return new Charge({
    id: doc._id.toString(),
    customerId: doc.customerId,
    amount: doc.amount,
    status: doc.status,
  });
}
```

---

## Domain → Infra

```ts id="repo_map3"
private toPersistence(charge: Charge) {
  return {
    _id: charge.id,
    customerId: charge.customerId,
    amount: charge.amount,
    status: charge.status,
  };
}
```

---

# Padrão de uso nos Use Cases

```ts id="repo_uc1"
export class CreateChargeUseCase {
  constructor(
    private readonly repo: ChargesRepository,
  ) {}

  async execute(input: Input) {
    const charge = new Charge(input);

    await this.repo.create(charge);

    return charge;
  }
}
```

---

# Benefícios do padrão

- isolamento de banco de dados
- fácil troca de MongoDB
- código testável
- domínio limpo
- arquitetura escalável

---

# Testabilidade

Repositories podem ser facilmente mockados:

```ts id="repo_test1"
const repoMock = {
  create: jest.fn(),
  findById: jest.fn(),
};
```

---

# Evolução futura

Esse padrão permite trocar MongoDB por:

- PostgreSQL
- DynamoDB
- Event Store

sem mudar o domínio.

---

# Regras finais

- Repository nunca contém regra de negócio
- Repository não emite eventos
- Repository não valida dados
- Repository apenas persiste e recupera

---

# Resultado esperado

Com este padrão:

- domínio permanece limpo
- persistência é substituível
- testes ficam simples
- sistema fica escalável

---

# Próximo documento

```
validation.md
```

Aqui vamos definir como garantir consistência de dados com DTOs e validação no NestJS.
```