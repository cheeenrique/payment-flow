# Customers Module

## Visão Geral

O módulo **Customers** é responsável pelo gerenciamento de clientes que realizam pagamentos no sistema Payment Flow.

Ele representa o lado “consumidor” do sistema de pagamentos.

Todo fluxo de cobrança e pagamento está diretamente ligado a um Customer.

---

# Responsabilidade do módulo

O Customers Module é responsável por:

- Cadastro de clientes
- Atualização de dados do cliente
- Consulta de clientes
- Histórico básico de relacionamento com cobranças
- Identificação do cliente no sistema

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Processamento de pagamentos
- Autenticação de usuários do sistema (Auth)
- Emissão de faturas
- Lógica de cobrança
- Regras de pagamento

---

# Entidade principal

## Customer

Representa um cliente que pode receber cobranças.

### Campos:

- id
- name
- email
- document (CPF/CNPJ simulado)
- phone
- status (active | inactive)
- createdAt
- updatedAt

---

# Relação com outros módulos

```text id="cust_rel1"
Customer
   │
   ├── Charges
   │       ├── Payments
   │       └── Invoices
   │
   └── Timeline (eventos do cliente)
```

---

# Fluxo principal

## Criação de cliente

```text id="cust_flow1"
User envia dados do cliente

↓

API valida dados

↓

Customer é criado no MongoDB

↓

Evento é emitido

↓

RabbitMQ publica evento

↓

Timeline registra criação

↓

Dashboard é atualizado via SSE
```

---

## Atualização de cliente

```text id="cust_flow2"
User envia atualização

↓

API valida alterações

↓

Customer é atualizado

↓

Evento é emitido

↓

Sistema registra mudança na timeline
```

---

# Endpoints (REST - Command Side)

## POST /customers

Cria um novo cliente.

### Input:
- name
- email
- document
- phone

---

## GET /customers

Lista clientes.

Suporta paginação.

---

## GET /customers/:id

Busca cliente por ID.

---

## PUT /customers/:id

Atualiza dados do cliente.

---

## DELETE /customers/:id

Desativa cliente (soft delete).

---

# Estratégia de dados

## Collection: customers

```json id="cust_db1"
{
  "_id": "ObjectId",
  "name": "Carlos Henrique",
  "email": "carlos@email.com",
  "document": "12345678900",
  "phone": "+55 62 99999-9999",
  "status": "active",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

# Eventos de domínio

## Eventos gerados

- customer.created
- customer.updated
- customer.deactivated

---

## Uso dos eventos

Esses eventos são consumidos por:

- Timeline Module
- Notifications Module
- Future analytics module

---

# Regras de negócio

- Email deve ser único
- Documento deve ser válido (simulação)
- Cliente desativado não pode receber cobranças
- Cliente é requisito obrigatório para Charge
- Não existe cobrança sem cliente

---

# Integração com arquitetura

## REST

Responsável por comandos:

- criação
- atualização
- remoção

---

## RabbitMQ

Propaga eventos de mudanças de estado do cliente.

---

## SSE

Atualiza dashboard em tempo real quando:

- cliente é criado
- cliente é atualizado

---

## GraphQL (futuro)

Será usado apenas para leitura avançada de clientes.

---

# Relacionamento com outros módulos

## Charges depende de Customers

Um Charge sempre pertence a um Customer.

Sem Customer não existe fluxo de pagamento.

---

# Importância no sistema

O Customer é o ponto inicial do fluxo de negócio.

Todo o sistema de pagamentos é construído a partir dele.

---

# Resultado esperado

Ao final deste módulo teremos:

- CRUD completo de clientes
- base para criação de cobranças
- integração com eventos
- rastreabilidade via timeline
- base sólida para o domínio de pagamentos

---

# Próximo módulo

```
charges.md
```

Aqui começaremos o coração do sistema:

👉 criação e ciclo de vida de cobranças
```