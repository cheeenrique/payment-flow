# Dashboard Flow

## Visão Geral

Dashboard é 100% baseado em eventos.

---

# Fluxo principal

```text id="dash1"
GraphQL → carga inicial
SSE → updates em tempo real
Pinia → estado central
UI → reativa
```

---

# Dados principais

- charges
- payments
- invoices
- timeline

---

# Atualização em tempo real

```text id="dash2"
payment.approved
→ update store
→ update UI
→ animation trigger
```

---

# Regra

> Dashboard nunca faz polling.