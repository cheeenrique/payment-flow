# Authentication Module

## Visão Geral

Este documento define como o sistema de autenticação do Payment Flow funciona utilizando JWT.

O objetivo é garantir acesso seguro, stateless e escalável ao backend.

---

# Estratégia de autenticação

O sistema utiliza:

- JWT (Access Token)
- Refresh Token
- Hash de senha (bcrypt)
- Sessões persistidas no MongoDB

---

# Fluxo de autenticação

## Login

```text id="auth_flow1"
User envia email + senha

↓

Backend valida credenciais

↓

Senha comparada com bcrypt

↓

Access Token gerado (JWT)

↓

Refresh Token gerado

↓

Refresh Token salvo no MongoDB

↓

Tokens retornados ao cliente
```

---

## Requisição autenticada

```text id="auth_flow2"
Request com Authorization: Bearer token

↓

JWT Strategy valida token

↓

Payload decodificado

↓

User carregado

↓

Request liberada
```

---

## Refresh Token

```text id="auth_flow3"
Access Token expira

↓

Client envia refresh token

↓

Backend valida no MongoDB

↓

Se válido:

   → novo access token gerado

↓

Se inválido:

   → 401 Unauthorized
```

---

# Entidade de usuário

## User

```json id="auth_user1"
{
  "_id": "ObjectId",
  "name": "Carlos",
  "email": "carlos@email.com",
  "passwordHash": "bcrypt_hash",
  "createdAt": "date",
  "updatedAt": "date"
}
```

---

# Sessões

## Refresh Token Storage

```json id="auth_session1"
{
  "_id": "ObjectId",
  "userId": "ObjectId",
  "refreshTokenHash": "hashed_token",
  "expiresAt": "date",
  "createdAt": "date"
}
```

---

# Endpoints

## POST /auth/register

Criação de usuário.

---

## POST /auth/login

Autenticação.

### Response:

```json
{
  "accessToken": "jwt",
  "refreshToken": "jwt"
}
```

---

## POST /auth/refresh

Gera novo access token.

---

## POST /auth/logout

Invalida sessão.

---

# Estratégia JWT

## Access Token

- curta duração (ex: 15min)
- stateless
- usado em todas requisições

---

## Refresh Token

- longa duração (ex: 7 dias)
- armazenado no MongoDB
- pode ser revogado

---

# Guards

## JwtAuthGuard

Protege rotas autenticadas:

```ts id="auth_guard1"
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

---

# Strategy

## JWT Strategy

```ts id="auth_strategy1"
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
```

---

# Password Security

## bcrypt

- hash de senha no registro
- comparação segura no login

---

# Segurança do sistema

- tokens não são armazenados no backend (access)
- refresh tokens são hashed
- sessões podem ser invalidadas
- proteção contra reuse de token

---

# Integração com eventos

Auth também gera eventos:

- auth.user.registered
- auth.user.logged_in
- auth.user.logged_out

Esses eventos alimentam:

- Notifications
- Timeline
- Auditoria

---

# Integração com arquitetura

## REST

- login
- register
- refresh
- logout

---

## Guards

Protegem módulos inteiros:

- charges
- payments
- invoices

---

## SSE

Pode notificar login/logout em tempo real

---

# Regras de negócio

- email deve ser único
- senha nunca é retornada
- refresh token pode ser revogado
- login invalida sessões antigas (opcional)
- JWT é stateless

---

# Boas práticas

- nunca expor passwordHash
- sempre usar HTTPS (produção)
- refresh token rotacionado (futuro)
- tokens curtos + refresh longo
- logs de autenticação obrigatórios

---

# Resultado esperado

Com este módulo:

- sistema seguro
- controle de acesso completo
- base para auditoria
- integração com eventos
- proteção de todos os módulos

---

# Próximo documento

```
events.md
```

Aqui vamos definir o backbone do sistema: como eventos fluem via RabbitMQ em todo o Payment Flow.
```