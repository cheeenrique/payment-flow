# Payment Flow Engine

## Visão Geral

Este módulo simula o fluxo completo de pagamentos.

---

# Tipos de pagamento

## PIX
- instantâneo

## Boleto
- delay de 5 minutos

## Cartão
- processamento assíncrono

---

# Fluxo base

```text id="flow1"
Charge Created
→ Payment Created
→ Processing
→ Approved / Failed
→ Invoice (optional)
→ SSE Event emitted
```

---

# Estado da charge

```ts id="state1"
pending → processing → paid → failed → expired
```

---

# Simulação de boleto

```text id="boleto1"
payment.created
→ wait 5 minutes
→ payment.approved
→ invoice.issued
```

---

# Simulação PIX

```text id="pix1"
payment.created
→ instant approve
→ invoice.issued
```

---

# Simulação cartão

```text id="card1"
payment.created
→ processing (2–10s)
→ random success/failure
```

---

# Evento central

```ts id="event1"
type PaymentEvent = {
  type: string;
  payload: any;
  correlationId: string;
};
```

---

# Regra importante

> Tudo no sistema é baseado em eventos.

---

# Integração com SSE

Backend emite:

- charge.created
- payment.updated
- invoice.issued

Frontend só consome.