# Payment Link (Checkout)

## Visão Geral

O **Payment Link** é a jornada humana de pagamento do Payment Flow.

Diferente do fluxo automático (onde o Simulator paga sozinho ao criar a cobrança), aqui um **cliente real percorre um checkout**: o operador cria a cobrança no dashboard e gera um link; o cliente abre o link (sem login), escolhe o método e confirma; só então o pagamento é disparado. O Simulator continua decidindo o resultado.

---

# Princípio

> O link de pagamento é uma porta pública e tokenizada para uma cobrança específica.

- Sem conta/login — o token na URL concede acesso àquela cobrança.
- O cliente apenas **dispara** o pagamento; o **resultado** continua sendo do Simulator.

---

# Modelo

## Token

- Cada cobrança nasce com um `paymentLinkToken` (random de alta entropia, único, inadivinhável).
- O link é `/(/pay/:token)` no frontend; o backend resolve a cobrança pelo token.
- O token dá acesso apenas a: view pública da cobrança, confirmação e stream daquela cobrança.

## Método de pagamento

- Não é fixado na criação da cobrança.
- O cliente escolhe no checkout entre `pix | boleto | credit_card`.

---

# Fluxo

```text id="plink_flow1"
[Operador] cria cobrança no dashboard
   → charge.created.v1 (status pending, token gerado, sem método)
   (NÃO dispara pagamento)

[Operador] copia o link /pay/:token e envia ao cliente

[Cliente] abre /pay/:token  → vê valor, descrição, status
          escolhe método    → POST /pay/:token/confirm { method }
   → charge.payment_requested.v1 (customerId, amount, method)
   → payments cria pagamento (processing) → payment.processing.v1
   → simulator decide → simulator.payment.approved|failed.v1
   → payments → payment.approved|failed.v1
   → charges atualiza status (paid | failed)

[Cliente] /pay/:token/stream (SSE público) reflete o resultado em tempo real
```

---

# Endpoints públicos (sem JWT)

| Método | Rota | Função |
|--------|------|--------|
| GET | `/pay/:token` | View pública da cobrança (campos seguros) |
| POST | `/pay/:token/confirm` | Confirma o método e dispara o pagamento |
| GET (SSE) | `/pay/:token/stream` | Stream em tempo real dos eventos daquela cobrança |

## View pública (GET /pay/:token)

```json id="plink_view1"
{
  "amount": 150.0,
  "currency": "BRL",
  "description": "...",
  "status": "pending",
  "availableMethods": ["pix", "boleto", "credit_card"],
  "customerName": "..."
}
```

Somente campos seguros — nunca expõe dados internos da cobrança ou do cliente.

## Confirmação (POST /pay/:token/confirm)

```json id="plink_confirm1"
{ "method": "pix" }
```

- Valida: cobrança ainda aguardando + método válido.
- Idempotente: cobrança já em processamento/terminal → 409.

---

# SSE público por token

- Guard por **token de link** (não JWT — diferente do stream autenticado do dashboard).
- Filtra o stream global pelos eventos cuja cobrança é a do token (`payload.chargeId`).
- Emite: `payment.processing`, `payment.approved`, `payment.failed`, e estados da charge (`paid`/`failed`/`expired`).

---

# Estados do checkout

```text id="plink_states1"
carregando → aguardando(seleção de método) → processando → aprovado | falhou | expirado
```

Se a cobrança já está em estado final ao abrir o link, o checkout exibe esse estado em modo leitura (confirmação bloqueada).

---

# Edge cases

| Caso | Comportamento |
|------|---------------|
| Token inexistente | 404 |
| Cobrança já paga/cancelada/expirada | Checkout em leitura; confirm bloqueado |
| Confirm em cobrança não-aguardando | 409 |
| Confirm duplicado | Idempotente (não dispara segundo pagamento) |
| Método inválido | 400 |
| Expira pelo cron com link aberto | Stream/refresh refletem `expired` |

---

# Segurança

- Token inadivinhável (alta entropia) = a "senha" do link.
- View pública expõe só o necessário.
- O stream público é restrito à cobrança do token.
- O resto do sistema (dashboard, comandos de escrita) continua protegido por JWT + RBAC.

---

# Relação com o resto do sistema

O Payment Link **não** muda Payments, Simulator, Invoices, Notifications, Timeline nem a expiração. Ele só muda **quando** `charge.payment_requested.v1` é emitido: no `confirm` do checkout, em vez de na criação da cobrança.

Spec técnico detalhado: `docs/superpowers/specs/2026-06-28-checkout-payment-link-design.md`.
Página de checkout (frontend): `docs/03-frontend/checkout.md`.
