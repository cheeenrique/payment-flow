# Auth Module (NestJS)

## Visão Geral

Responsável por autenticação, login, registro e emissão de JWT.

---

# Fluxo de autenticação

```text id="auth_flow1"
Register → Login → JWT → Permissions loaded → Access API
```

---

# Endpoints

## Public

```http
POST /auth/register
POST /auth/login
```

---

## Private

```http
GET /auth/me
POST /auth/refresh
```

---

# User Model

```ts id="auth_user1"
type User = {
  id: string;
  email: string;
  passwordHash: string;
  roles: string[];
};
```

---

# JWT Payload

```ts id="auth_jwt1"
type JwtPayload = {
  sub: string;
  roles: string[];
  permissions: string[];
};
```

---

# Regras

- senha nunca sai do backend
- JWT contém permissions resolvidas
- login resolve roles → permissions
- auth não depende de frontend

---

# Segurança

- bcrypt para senha
- JWT short-lived (15m)
- refresh token (7d)