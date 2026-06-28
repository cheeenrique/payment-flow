# Auth Module

## Visão Geral

O módulo **Auth** é responsável pela autenticação e autorização dos usuários do sistema Payment Flow.

Ele controla o acesso às funcionalidades da plataforma e garante que apenas usuários autenticados possam interagir com o sistema.

---

# Responsabilidade do módulo

O Auth Module é responsável por:

- Autenticação de usuários
- Geração de tokens JWT
- Validação de sessões
- Refresh token
- Logout
- Controle básico de acesso

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Gestão de clientes do sistema (Customer)
- Permissões avançadas por role (RBAC complexo)
- Integrações com provedores externos (Google, GitHub etc.)
- Autenticação multi-fator (MFA)

---

# Entidade principal

## User (Usuário do sistema)

Representa o usuário que acessa o Payment Flow.

### Campos:

- id
- name
- email
- password (hash)
- createdAt
- updatedAt

---

# Fluxo de autenticação

## Login

```text id="auth_flow1"
User envia email + password

↓

API valida credenciais

↓

Senha é verificada via hash

↓

JWT é gerado

↓

Refresh token é armazenado

↓

Token é retornado ao frontend
```

---

## Acesso autenticado

```text id="auth_flow2"
Frontend envia JWT

↓

Middleware valida token

↓

Token decodificado

↓

User anexado à request

↓

Request liberada
```

---

## Refresh Token

```text id="auth_flow3"
Access token expira

↓

Frontend envia refresh token

↓

Backend valida refresh token

↓

Novo access token é gerado

↓

Novo token retornado
```

---

# Endpoints (REST - Command Side)

## POST /auth/register

Cria um novo usuário.

### Input:
- name
- email
- password

---

## POST /auth/login

Autentica usuário.

### Input:
- email
- password

### Output:
- accessToken
- refreshToken

---

## POST /auth/refresh

Gera novo access token.

---

## POST /auth/logout

Invalida sessão.

---

# Estratégia de segurança

- Senhas armazenadas com bcrypt
- JWT stateless
- Refresh token armazenado no banco
- Expiração curta de access token

---

# Eventos de domínio

Mesmo sendo um módulo simples, Auth também gera eventos.

## Eventos:

- auth.user.registered
- auth.user.logged_in
- auth.user.logged_out
- auth.token.refreshed

---

# Persistência (MongoDB)

## Collection: users

```json id="auth_db1"
{
  "_id": "ObjectId",
  "name": "Carlos",
  "email": "carlos@email.com",
  "passwordHash": "xxx",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

## Collection: sessions

```json id="auth_db2"
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "refreshToken": "hashed",
  "expiresAt": "date",
  "createdAt": "date"
}
```

---

# Integração com arquitetura

## Camada REST

- Responsável por comandos
- Login / Register / Refresh

---

## Eventos

Auth publica eventos para:

- Notification module
- Timeline module
- Audit logs (futuro)

---

## RabbitMQ

Eventos de autenticação podem ser consumidos por:

- notifications
- timeline

---

# Regras de negócio

- Email deve ser único
- Senha nunca é retornada
- Refresh token tem expiração
- Logout invalida sessão ativa
- JWT não é armazenado no backend

---

# Dependências

Auth NÃO depende de:

- Payments
- Charges
- Customers

Ele é completamente isolado.

---

# Resultado esperado

Ao final deste módulo teremos:

- autenticação funcional
- base de segurança do sistema
- eventos de login rastreáveis
- integração com arquitetura event-driven

---

# Próximo módulo

```
customers.md
```

Onde começaremos a modelar o primeiro domínio de negócio real do sistema.
```