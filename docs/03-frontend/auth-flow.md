# Auth Flow (Frontend)

## Fluxo

```text id="authfe1"
Login → JWT → Store → Permissions → UI desbloqueada
```

---

# Estados

## Public
- login
- register

## Private
- dashboard
- payments
- charges

---

# Store de auth

```ts id="authfe2"
user
token
permissions
roles
```

---

# Regras

- token sempre em memória (ou storage seguro)
- permissions controlam UI
- logout limpa store