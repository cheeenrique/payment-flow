# Permissions UI Layer

## Visão Geral

Controle de UI baseado em permissions do usuário.

---

# Exemplo

## Botão protegido

```vue id="perm1"
<button v-if="can('charges:create')">
  Criar cobrança
</button>
```

---

# Helper

```ts id="perm2"
function can(permission: string) {
  return store.permissions.includes(permission);
}
```

---

# Regra importante

> Frontend só esconde UI — backend decide de verdade