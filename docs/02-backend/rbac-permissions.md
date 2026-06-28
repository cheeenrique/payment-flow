# RBAC + Permissions System

## Visão Geral

Sistema de controle de acesso baseado em:

User → Roles → Permissions

---

# Permissions (granulares)

```text id="perm1"
charges:create
charges:read
charges:update
charges:delete

payments:simulate
payments:approve
payments:refund

invoices:issue
invoices:read

dashboard:view
timeline:view
```

---

# Roles

## viewer (usuário comum)
```text id="role1"
dashboard:view
charges:read
payments:read
timeline:view
```

---

## operator
```text id="role2"
charges:create
payments:approve
invoices:issue
timeline:view
```

---

## admin
```text id="role3"
*
```

---

# Guard (NestJS)

```ts id="rbac_guard1"
@SetMetadata('permissions', ['charges:create'])
```

---

# Permissions Guard

```ts id="rbac_guard2"
canActivate(context) {
  const user = request.user;
  const required = metadata;

  return required.every(p =>
    user.permissions.includes(p)
  );
}
```

---

# Regra principal

> Backend SEMPRE valida permissionamento.