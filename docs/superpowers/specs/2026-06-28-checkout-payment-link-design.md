# Checkout / Payment Link — Design

**Data:** 2026-06-28
**Status:** aprovado
**Abordagem:** A (estender o módulo charges + reusar a infra de SSE; frontend em app único com dois grupos de rota)

## Contexto

Hoje o sistema processa pagamentos de forma 100% automática: ao criar uma cobrança, o `create-charge` dispara imediatamente `charge.payment_requested.v1`, o módulo Payments cria o pagamento e o Simulator decide o resultado. O "pagador" é o Simulator.

Esta feature adiciona uma **jornada humana de checkout** (estilo Stripe Payment Link): o operador cria a cobrança no dashboard e gera um **link**; um cliente abre o link (sem login), escolhe o método de pagamento e confirma; só então o fluxo de pagamento é disparado. O Simulator continua decidindo o resultado (aprovado/recusado) pelas regras atuais.

### Decisões de produto (definidas no brainstorming)

1. **Quem decide o resultado:** o Simulator (realista). O checkout apenas dispara o pagamento.
2. **Acesso ao checkout:** link tokenizado público, sem login (token na URL identifica a cobrança).
3. **Status no checkout:** SSE público dedicado por token, filtrado para aquela cobrança.
4. **Método de pagamento:** escolhido pelo cliente no checkout (não fixado na criação).
5. **Separação:** checkout é uma superfície separada do dashboard (rota pública vs rotas autenticadas).

## Objetivo

Permitir o ciclo: dashboard cria cobrança → gera link → cliente percorre o checkout → confirma → fluxo event-driven existente processa → checkout reflete o resultado em tempo real.

## Não-objetivos (YAGNI)

- Gateway/PSP de pagamento real (o Simulator continua sendo o "PSP").
- Conta/login para o pagador.
- Configuração de quais métodos são permitidos por cobrança (cliente escolhe entre todos).
- Expiração do link independente da cobrança (usa o `expiresAt` da própria charge).
- Filtragem por usuário no SSE autenticado do dashboard (continua broadcast; fora de escopo).

---

## Arquitetura

### Backend (módulo charges + infra SSE)

Tudo que é "link de pagamento" é propriedade da cobrança, então vive no módulo `charges`, em uma camada de apresentação **pública** (sem JWT), além de um stream SSE público.

#### Entidade Charge

- Novo campo `paymentLinkToken: string` — random de alta entropia (ex: `nanoid`/`randomUUID` sem hifens), **índice único**, gerado na criação. Inadivinhável; concede acesso somente à view pública, confirm e stream daquela cobrança.
- `paymentMethod` passa a ser **opcional** (`PaymentMethod | null`) — definido no confirm do checkout.
- Cobrança nasce com status `pending` (aguardando pagamento). **Não** dispara pagamento na criação.
- Novo método de domínio para registrar o método escolhido e iniciar o pagamento (ex: `selectMethodAndRequestPayment(method)`), com guarda: só permitido se a cobrança ainda está aberta (não terminal, sem pagamento já solicitado).

#### Use cases (charges/application)

- **create-charge** (alterado): gera `paymentLinkToken`, persiste com `paymentMethod = null` e status `pending`, emite `charge.created.v1` (mantém — timeline/notifications), **deixa de emitir** `charge.payment_requested.v1`. Output inclui o `paymentLinkToken` (e a URL do link montada na borda).
- **get-charge-by-token** (novo): busca a cobrança pelo token e retorna uma **view pública** com apenas campos seguros: `{ amount, currency, description, status, availableMethods, customerName? }`. `availableMethods = ['pix','boleto','credit_card']`. Lança `NotFoundError` se o token não existir.
- **confirm-payment-link** (novo): recebe `{ token, method }`. Carrega a cobrança pelo token; valida que está aguardando pagamento (não terminal e ainda não solicitada) e que o método é válido; aplica `selectMethodAndRequestPayment(method)`, persiste e emite `charge.payment_requested.v1` com `{ customerId, amount, method }`. Idempotência: se a cobrança já está em processamento/paga/terminal → `ConflictError` (409). Retorna o status atual.

#### Repositório (charges)

- `findByPaymentLinkToken(token): Promise<Charge | null>` na interface (domain) + impl Mongo (índice único em `paymentLinkToken`).

#### Apresentação pública (charges/presentation/public) — sem JWT

- `GET /pay/:token` → `get-charge-by-token` → view pública. 404 se token desconhecido.
- `POST /pay/:token/confirm` body `{ method }` → `confirm-payment-link`. Valida `method ∈ {pix,boleto,credit_card}` (DTO class-validator) → 400 se inválido. 409 se cobrança não está mais aguardando.

Estas rotas **não** usam `JwtAuthGuard`/`PermissionsGuard`. O envelope de resposta global `{ data, meta }` e o `GlobalExceptionFilter` continuam valendo (REST normal).

#### SSE público por token (infra/sse + charges)

- `GET /pay/:token/stream` (SSE) protegido por um **guard de token de link** (não JWT): valida o `paymentLinkToken` (existe e cobrança encontrada). Diferente do `SseJwtGuard` do dashboard.
- Filtra o `SseService` global pelos eventos cuja `payload.chargeId` é a cobrança do token (os eventos de domínio já carregam `chargeId`). Emite as mudanças relevantes: `payment.processing`, `payment.approved`, `payment.failed`, e estados da charge (`paid`/`failed`/`expired`).
- Implementação: o `SseService.stream()` (Observable global) é filtrado com `rxjs filter` por `chargeId`. Um método novo `SseService.streamForCharge(chargeId)` encapsula esse filtro (mantém o domínio fora do controller).

### Frontend (app único Vue, dois grupos de rota)

Introduz `vue-router` no `apps/web` com dois grupos:

- **Público:** `/pay/:token` → página de Checkout, layout próprio (`CheckoutLayout`), **sem** guard de auth.
- **Autenticado:** dashboard (`/`, `/charges`, `/login`, etc.) com guard de auth (JWT). (A implementação do dashboard em si é uma fase posterior; aqui garantimos a estrutura de rotas e o ponto onde o link é exibido.)

#### Dashboard (incremento mínimo nesta feature)

- Ao criar uma cobrança, exibir o **link de pagamento** gerado (`/pay/:token`) de forma copiável.

#### Página de Checkout (`/pay/:token`)

Estados: `carregando → aguardando(seleção de método) → processando → aprovado | falhou | expirado | indisponível`.

Fluxo:
1. `GET /pay/:token` → exibe valor, descrição, status.
2. Se aguardando: seletor de método (pix/boleto/cartão) + campos fake por método (cartão: formulário fake; pix/boleto: sem entrada, artefato gerado após confirmar).
3. Confirmar → `POST /pay/:token/confirm { method }` → estado "processando".
4. Abrir SSE `GET /pay/:token/stream` → atualizar status em tempo real.
5. Resultado: aprovado (tela de sucesso + artefato fake: QR do pix / código do boleto), falhou (mensagem + opção de tentar outro método, se a regra permitir), expirado.

Se a cobrança já está em estado final ao abrir o link, o checkout mostra esse estado em modo leitura (confirm bloqueado).

---

## Fluxo de eventos (model A)

```
[Dashboard] POST /charges
   → charge.created.v1            (charge: pending, paymentLinkToken gerado, sem método)
   (NÃO emite charge.payment_requested)

[Operador] copia o link /pay/:token e envia ao cliente

[Cliente] GET /pay/:token         (view pública)
          POST /pay/:token/confirm { method }
   → charge.payment_requested.v1  (customerId, amount, method)
   → payments cria Payment(processing) → payment.processing.v1
   → simulator decide → simulator.payment.approved|failed.v1
   → payments → payment.approved|failed.v1
   → charges atualiza status (paid/failed)
   → /pay/:token/stream empurra os eventos da cobrança → checkout reflete o resultado
```

---

## Tratamento de erros / edge cases

| Caso | Comportamento |
|------|---------------|
| Token inexistente | 404 (NotFoundError) em GET/POST/stream |
| Cobrança já paga/cancelada/expirada ao abrir | Checkout em modo leitura; confirm bloqueado |
| Confirm em cobrança não-aguardando | 409 (ConflictError) |
| Confirm duplicado (já solicitado) | 409 (idempotente — não dispara segundo pagamento) |
| Método inválido | 400 (ValidationError do DTO) |
| Cobrança expira pelo cron enquanto o link está aberto | Stream/refresh refletem `expired` |

Erros seguem o padrão do projeto (errors as data + `GlobalExceptionFilter`).

---

## Testes (unit; e2e fica para o fim do projeto)

- **create-charge:** gera `paymentLinkToken`, persiste sem método, emite `charge.created.v1` e **não** emite `charge.payment_requested.v1`.
- **confirm-payment-link:** transição válida → emite `charge.payment_requested.v1` com o método; cobrança terminal/já solicitada → `ConflictError`; método inválido → rejeitado.
- **get-charge-by-token:** mapeia para a view pública (somente campos seguros); token inexistente → `NotFoundError`.
- **entidade Charge:** `selectMethodAndRequestPayment` com guardas de estado.
- **SseService.streamForCharge:** filtra eventos pelo `chargeId`.

---

## Impacto em comportamento existente

- A criação de cobrança **deixa de pagar automaticamente**. Os testes/smoke atuais que assumiam `charge.created → paid` automático mudam para o novo modelo (pagamento via checkout). O caminho automático antigo não é mais o padrão.
- O Simulator, Payments, Invoices, Notifications, Timeline e a expiração permanecem inalterados — o checkout só muda **quando** `charge.payment_requested.v1` é emitido (no confirm, em vez de na criação).

---

## Unidades e fronteiras

- **charges (público):** `get-charge-by-token`, `confirm-payment-link`, controller público, guard de token, repo `findByPaymentLinkToken`. Entrada: token + método. Saída: view pública / disparo de `charge.payment_requested.v1`.
- **infra/sse:** `streamForCharge(chargeId)` — stream filtrado. Reusa o Subject global.
- **frontend checkout:** consome `GET /pay/:token`, `POST /confirm`, `GET /stream`. Sem regra de negócio; reflete estado.
- **frontend dashboard (incremento):** exibe o link na criação.

Cada unidade é testável isoladamente com mocks das ports.
