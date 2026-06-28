# Checkout (Página Pública)

## Visão Geral

A página de **Checkout** é a superfície pública do Payment Flow, separada do dashboard.

Ela é aberta pelo cliente através do **link de pagamento** (`/pay/:token`), sem login, e conduz a jornada: ver a cobrança → escolher método → confirmar → acompanhar o resultado em tempo real.

Domínio: ver `docs/01-domain/payment-link.md`.

---

# Princípio

> O checkout não tem estado próprio nem regra de negócio — reflete a cobrança e dispara o pagamento.

---

# Onde vive

App único Vue com `vue-router`:

- **Pública:** `/pay/:token` → Checkout (`CheckoutLayout`, sem guard de auth)
- **Autenticada:** dashboard (`/`, `/charges`, `/login`...) com guard

O checkout não usa o store/SSE autenticado do dashboard — usa as rotas públicas por token.

---

# Estados

```text id="checkout_states1"
carregando → aguardando (seleção de método) → processando → aprovado | falhou | expirado | indisponível
```

---

# Fluxo da página

```text id="checkout_flow1"
GET /pay/:token            → exibe valor, descrição, status
   ↓ (se aguardando)
seletor de método          → pix | boleto | credit_card  (+ campos fake por método)
   ↓
POST /pay/:token/confirm   → estado "processando"
   ↓
GET /pay/:token/stream     → SSE público, atualiza status em tempo real
   ↓
resultado: aprovado | falhou | expirado
```

---

# Por método (fake)

| Método | Antes de confirmar | Depois (aprovado) |
|--------|--------------------|-------------------|
| pix | botão confirmar | QR code fake + "aguardando/aprovado" |
| boleto | botão confirmar | linha digitável / código de barras fake |
| credit_card | formulário fake (número, validade, cvv) | confirmação |

Nenhum dado é processado de verdade — é simulação visual.

---

# Componentes

- `CheckoutPage` — orquestra o fluxo/estados
- `ChargeSummaryCard` — valor, descrição, status da cobrança
- `MethodSelector` — escolha pix/boleto/cartão
- `CardFormFake` / `PixArtifactFake` / `BoletoArtifactFake` — artefatos por método
- `CheckoutStatus` — estado em tempo real (processando/aprovado/falhou/expirado)
- `CheckoutLayout` — layout enxuto, sem navbar do dashboard

---

# Integração

| Camada | Uso |
|--------|-----|
| REST | `GET /pay/:token` (view), `POST /pay/:token/confirm` |
| SSE | `GET /pay/:token/stream` (status em tempo real, por token) |
| GraphQL | não usado no checkout |

Sem Pinia global obrigatório — o checkout pode ter estado local de página (é uma jornada isolada e efêmera).

---

# Edge cases (UI)

- Token inexistente → tela "link inválido".
- Cobrança já final ao abrir → mostra estado (pago/cancelado/expirado), sem confirmar.
- Confirm rejeitado (409) → mostra o estado atual.
- Falha de rede no SSE → reconecta (retry com backoff) e/ou refaz `GET /pay/:token`.

---

# Animações

`@vueuse/motion` para transições de estado (processando → aprovado/falhou), igual ao padrão do dashboard (ver `docs/03-frontend/animations.md`) — feedback visual claro do desfecho.

---

# Fora de escopo

- Login/conta do pagador.
- Pagamento real.
- Escolha de métodos permitidos pelo operador (cliente escolhe entre todos).
