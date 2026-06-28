# Frontend (Dashboard) + Checkout/Payment Link — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o dashboard Vue 3 em tempo real (Fase 1) e, na sequência, a jornada pública de checkout via payment link (Fase 2), encaixando no backend event-driven existente.

**Architecture:** App único Vue 3 + vue-router com dois grupos de rota — autenticado (dashboard) e público (checkout `/pay/:token`). Dados: REST (comandos/carga inicial) + GraphQL (agregados) + SSE (tempo real). Backend já está completo/validado; a Fase 2 adiciona o payment link em charges + SSE.

**Tech Stack:** Vue 3 (Composition API), TypeScript, Vite, vue-router, Pinia, TailwindCSS, shadcn-vue, lucide-vue-next, @apollo/client + graphql, axios, EventSource (SSE nativo), @vueuse/motion, Vitest. Backend: NestJS 10 (webpack builder), Mongoose, @nestjs/microservices RMQ.

## Global Constraints

- Comentários de código em **português (pt-BR)**. Identificadores em inglês.
- Imports via alias `@/` (web: `@/*`→`apps/web/src/*`; api: já configurado `@/*`→`apps/api/src/*`). Nunca `../../..`.
- SOLID, DIP, errors as data, DRY, YAGNI. Funções ≤30 linhas, arquivos ≤300, sem `any`.
- Backend: config só via ConfigService; build `npm run build --workspace @payment-flow/api` (webpack) deve passar; testes via `npm run test --workspace @payment-flow/api` (rodar de `apps/api`).
- Frontend: zero regra de negócio na UI; estado vem de store/serviço; sem polling onde houver SSE.
- Portas do projeto (docker host): api 3100, web 3101, mongo 3102, rabbitmq 3103/3104. Dev local: api em :3100, infra em localhost:3102/3103.
- Conventional Commits; commits frequentes por task.
- Backend já tem: SSE autenticado `GET /events/stream?token=JWT`, query GraphQL `dashboard: DashboardSummary`, RBAC (roles/permissions), envelope REST `{ data, meta }`, erros padronizados.

---

# FASE 1 — Dashboard

Referência: `docs/03-frontend/*.md` (README, stack, setup, dashboard, components, state-management, sse-integration, graphql-client, animations).

## Task 1.1: Setup de tooling do frontend

**Files:**
- Modify: `apps/web/package.json` (deps + scripts)
- Create: `apps/web/tailwind.config.js`, `apps/web/postcss.config.js`, `apps/web/src/style.css`
- Modify: `apps/web/vite.config.ts` (alias `@`, server.port 5173)
- Modify: `apps/web/tsconfig.json` (paths `@/*`)
- Create: `apps/web/eslint.config.js` (flat config vue+ts), `apps/web/vitest.config.ts`
- Modify: `apps/web/src/main.ts` (Pinia + router + motion + style.css)

**Interfaces:**
- Produces: app Vue com Pinia, vue-router, Tailwind, alias `@/`, vitest configurados.

- [ ] **Step 1: Instalar deps** (rodar da raiz)

```bash
npm install vue-router@4 pinia @apollo/client graphql axios @vueuse/motion lucide-vue-next --workspace @payment-flow/web
npm install -D tailwindcss@3 postcss autoprefixer vitest @vue/test-utils jsdom eslint eslint-plugin-vue vue-eslint-parser @vitejs/plugin-vue typescript-eslint --workspace @payment-flow/web
```

- [ ] **Step 2: Tailwind config** — `apps/web/tailwind.config.js` com `content: ["./index.html","./src/**/*.{vue,ts}"]`; `postcss.config.js` com tailwindcss+autoprefixer; `src/style.css` com `@tailwind base/components/utilities`.
- [ ] **Step 3: shadcn-vue init** — `npx shadcn-vue@latest init` (Vue, neutral, Tailwind) e `npx shadcn-vue@latest add button card dialog table badge input` em `apps/web`.
- [ ] **Step 4: vite alias** — adicionar `resolve.alias['@'] = path.resolve(__dirname,'src')` ao `vite.config.ts`; `tsconfig.json` `paths: {"@/*":["src/*"]}`.
- [ ] **Step 5: main.ts** — `createApp(App).use(createPinia()).use(router).use(MotionPlugin).mount('#app')` + import `./style.css`.
- [ ] **Step 6: eslint + vitest config** — flat config vue+ts (ignorar dist); `vitest.config.ts` com environment jsdom + alias `@`. Substituir o script `lint` placeholder por `eslint "src/**/*.{ts,vue}"`; `test` por `vitest run --passWithNoTests`.
- [ ] **Step 7: build sanity** — `npm run build --workspace @payment-flow/web` (vue-tsc + vite build) deve passar.
- [ ] **Step 8: Commit** — `chore(web): tooling (router, pinia, tailwind, shadcn, motion, vitest)`

## Task 1.2: Config de ambiente + cliente HTTP (axios + interceptor JWT)

**Files:**
- Create: `apps/web/src/services/http.ts`, `apps/web/.env`, `apps/web/.env.example`
- Test: `apps/web/src/services/http.spec.ts`

**Interfaces:**
- Produces: `http` (instância axios com baseURL `VITE_API_URL`, injeta `Authorization: Bearer <token>` do auth store/localStorage); helper `unwrap<T>(res): T` que extrai `res.data.data` do envelope.

- [ ] **Step 1: .env** — `VITE_API_URL=http://localhost:3100` (e `.env.example` igual).
- [ ] **Step 2: Teste falhando** — `http.spec.ts`: `unwrap({ data:{ data:{x:1}, meta:{} }})` retorna `{x:1}`.
- [ ] **Step 3: Run** `npm run test --workspace @payment-flow/web` → FAIL.
- [ ] **Step 4: Implementar** `http.ts` — `axios.create({ baseURL: import.meta.env.VITE_API_URL })`; interceptor de request lê token (de `localStorage.getItem('accessToken')`) e seta header; `unwrap` extrai `.data.data`.
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** — `feat(web): cliente HTTP com envelope + JWT`

## Task 1.3: Apollo GraphQL client

**Files:**
- Create: `apps/web/src/services/apollo.ts`, `apps/web/src/graphql/dashboard.query.ts`

**Interfaces:**
- Produces: `apolloClient` (uri `${VITE_API_URL}/graphql`, authLink injeta Bearer, InMemoryCache); `DASHBOARD_SUMMARY` gql doc.

- [ ] **Step 1: apollo.ts** — `ApolloClient` com `HttpLink({ uri })` + `setContext` authLink (header Bearer do localStorage) + `InMemoryCache`.
- [ ] **Step 2: dashboard.query.ts** — `gql` query `dashboard { charges{total pending paid failed expired canceled} payments{total approved failed processing} invoices{total issued failed} approvalRate }` (campos conforme `DashboardSummary` do backend).
- [ ] **Step 3: build sanity** → passa.
- [ ] **Step 4: Commit** — `feat(web): apollo client + query dashboard`

## Task 1.4: Serviço SSE + dispatcher

**Files:**
- Create: `apps/web/src/streams/sse.ts`, `apps/web/src/streams/dispatcher.ts`
- Test: `apps/web/src/streams/dispatcher.spec.ts`

**Interfaces:**
- Consumes: stores da Task 1.7 (via callback registry — desacoplar: dispatcher recebe um mapa `type → handler`).
- Produces: `createEventStream(token, onEvent)` (EventSource em `${VITE_API_URL}/events/stream?token=<jwt>`, reconnect com backoff); `dispatch(event, handlers)` que roteia por `event.type`.

- [ ] **Step 1: Teste falhando** — `dispatcher.spec.ts`: `dispatch({type:'payment.approved', payload:{...}}, handlers)` chama `handlers['payment.approved']` com o payload; tipo desconhecido → no-op.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar** `dispatcher.ts` (switch/registry por `event.type`) e `sse.ts` (`EventSource` + `onmessage`→`JSON.parse`→`onEvent`; `onerror`→close+retry `setTimeout(min(1000*tries,10000))`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(web): SSE stream + dispatcher por tipo de evento`

## Task 1.5: Auth store + login + route guard

**Files:**
- Create: `apps/web/src/stores/auth.store.ts`, `apps/web/src/services/auth.service.ts`, `apps/web/src/pages/LoginPage.vue`
- Test: `apps/web/src/stores/auth.store.spec.ts`

**Interfaces:**
- Consumes: `http` (1.2).
- Produces: `useAuthStore` (`{ user, accessToken, isAuthenticated, login(email,pw), logout(), loadMe() }`); persiste token em localStorage; `auth.service` (`postLogin`, `getMe`).

- [ ] **Step 1: Teste falhando** — `auth.store.spec.ts`: `login` salva token + seta `isAuthenticated=true` (mock auth.service); `logout` limpa.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar** store (Pinia setup store) + service (`POST /auth/login` → unwrap → `{accessToken,refreshToken}`; `GET /auth/me` → user). Persistir accessToken em localStorage.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: LoginPage.vue** — form email/senha (shadcn input/button) → `authStore.login` → redirect `/`.
- [ ] **Step 6: Commit** — `feat(web): auth store + login + persistência de token`

## Task 1.6: Router + layouts

**Files:**
- Create: `apps/web/src/router/index.ts`, `apps/web/src/layouts/AppLayout.vue`, `apps/web/src/layouts/CheckoutLayout.vue`, `apps/web/src/pages/DashboardPage.vue` (placeholder)
- Modify: `apps/web/src/App.vue` (`<router-view/>`)

**Interfaces:**
- Consumes: `useAuthStore` (1.5).
- Produces: rotas — `/login` (público), `/` `/charges` `/payments` `/invoices` (auth, AppLayout), `/pay/:token` (público, CheckoutLayout — page placeholder até Fase 2). `beforeEach` guard: rota auth sem token → `/login`.

- [ ] **Step 1: router/index.ts** — definir rotas + `meta.requiresAuth`; guard global `beforeEach` (checa `authStore.isAuthenticated`).
- [ ] **Step 2: AppLayout.vue** — navbar + sidebar + `<router-view/>`; CheckoutLayout — layout enxuto.
- [ ] **Step 3: App.vue** — só `<router-view/>`.
- [ ] **Step 4: build + navegação manual** — `/login`→login→`/` ok; rota auth sem token redireciona.
- [ ] **Step 5: Commit** — `feat(web): router + layouts + guard de auth`

## Task 1.7: Stores de domínio (Pinia)

**Files:**
- Create: `apps/web/src/stores/{charges,payments,invoices,timeline,notifications}.store.ts`, `apps/web/src/types/index.ts`
- Test: `apps/web/src/stores/charges.store.spec.ts`

**Interfaces:**
- Produces: tipos `Charge, Payment, Invoice, TimelineEvent, Notification`; stores com `list` + ações `set(list)`, `upsert(item)` (por id), e timeline/notifications `prepend(item)`. Handlers para o dispatcher (1.4): `charge.created/updated`→charges.upsert; `payment.*`→payments.upsert; `invoice.*`→invoices.upsert; `notification.created`→notifications.prepend; eventos de timeline→timeline.prepend.

- [ ] **Step 1: types/index.ts** — tipos conforme docs (Charge status pending|paid|failed|expired|canceled; Payment processing|approved|failed|...; etc).
- [ ] **Step 2: Teste falhando** — `charges.store.spec.ts`: `upsert` adiciona novo e atualiza existente por id.
- [ ] **Step 3: Run** → FAIL.
- [ ] **Step 4: Implementar** os 5 stores (padrão upsert/prepend) + um `registerSseHandlers()` que monta o mapa `type→handler` pro dispatcher.
- [ ] **Step 5: Run** → PASS.
- [ ] **Step 6: Commit** — `feat(web): stores de domínio + handlers SSE`

## Task 1.8: Componentes compartilhados

**Files:**
- Create: `apps/web/src/components/common/{StatusBadge,DashboardCard}.vue`
- Test: `apps/web/src/components/common/StatusBadge.spec.ts`

**Interfaces:**
- Produces: `StatusBadge` (prop `status` → cor: paid/approved/issued=verde, pending/processing/requested=amarelo, failed/expired/canceled=vermelho); `DashboardCard` (title, value slot).

- [ ] **Step 1: Teste falhando** — `StatusBadge.spec.ts` (@vue/test-utils): renderiza texto do status e classe de cor correta p/ 'paid'.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar** os componentes (mapa status→classe Tailwind).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(web): componentes comuns (StatusBadge, DashboardCard)`

## Task 1.9: Painel de Charges (lista + criar + exibir link)

**Files:**
- Create: `apps/web/src/components/charges/{ChargesTable,CreateChargeDialog}.vue`, `apps/web/src/services/charges.service.ts`
- Test: `apps/web/src/services/charges.service.spec.ts`

**Interfaces:**
- Consumes: `http` (1.2), `useChargesStore` (1.7), `StatusBadge` (1.8).
- Produces: `charges.service` (`list(page,limit)`→`{items,total}` via unwrap+meta.pagination; `create(dto)`→charge com `paymentLinkToken` (Fase 2; na Fase 1 o create existe mas o token pode estar ausente até a Fase 2)); `ChargesTable` (colunas id/cliente/valor/status/data); `CreateChargeDialog` (form customerId/amount/method/description/expiresAt).

- [ ] **Step 1: Teste falhando** — `charges.service.spec.ts`: `list` retorna items + total a partir do envelope `{data:[...],meta:{pagination:{total}}}` (mock http).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar** service + `ChargesTable` (consome store) + `CreateChargeDialog` (`POST /charges` → store.upsert).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(web): painel de charges (lista + criação)`

## Task 1.10: Painel de Payments

**Files:**
- Create: `apps/web/src/components/payments/{PaymentsList,PaymentStatusCard}.vue`, `apps/web/src/services/payments.service.ts`

**Interfaces:**
- Consumes: `http`, `usePaymentsStore`, `StatusBadge`.
- Produces: `payments.service.listByCharge(chargeId,page,limit)`; `PaymentsList`/`PaymentStatusCard` (status, método, tempo).

- [ ] **Step 1: Implementar** service + componentes (UI pura, dados do store).
- [ ] **Step 2: build + render manual** ok.
- [ ] **Step 3: Commit** — `feat(web): painel de payments`

## Task 1.11: Painel de Invoices

**Files:**
- Create: `apps/web/src/components/invoices/InvoiceCard.vue`, `apps/web/src/services/invoices.service.ts`

**Interfaces:**
- Consumes: `http`, `useInvoicesStore`, `StatusBadge`.
- Produces: `invoices.service` (`getByPayment(paymentId)`); `InvoiceCard` (status emissão, referência, relação com payment).

- [ ] **Step 1: Implementar** service + InvoiceCard.
- [ ] **Step 2: Commit** — `feat(web): painel de invoices`

## Task 1.12: Timeline feed

**Files:**
- Create: `apps/web/src/components/timeline/TimelineFeed.vue`, `apps/web/src/services/timeline.service.ts`

**Interfaces:**
- Consumes: `useTimelineStore`, apollo (`timeline` query) ou REST; `@vueuse/motion`.
- Produces: `TimelineFeed` (lista append-only, ordenada por timestamp, agrupável por correlationId; itens com v-motion enter).

- [ ] **Step 1: Implementar** carga inicial (GraphQL `timeline(page,limit)`) + append via store (SSE) + animação de entrada.
- [ ] **Step 2: Commit** — `feat(web): timeline feed em tempo real`

## Task 1.13: Notificações (toasts via SSE)

**Files:**
- Create: `apps/web/src/components/notifications/NotificationToast.vue`, `apps/web/src/components/notifications/NotificationHost.vue`

**Interfaces:**
- Consumes: `useNotificationsStore`.
- Produces: `NotificationHost` (renderiza toasts ativos, auto-dismiss após timeout, v-motion slide-in/fade-out); `NotificationToast` (tipo success/error/info/warning).

- [ ] **Step 1: Implementar** host + toast (consome store; novos via SSE `notification.created`).
- [ ] **Step 2: Commit** — `feat(web): sistema de notificações (toast SSE)`

## Task 1.14: Página Dashboard (compose + GraphQL summary + wire realtime)

**Files:**
- Modify: `apps/web/src/pages/DashboardPage.vue`
- Create: `apps/web/src/composables/useRealtime.ts`

**Interfaces:**
- Consumes: todos os stores/painéis; `apolloClient` + `DASHBOARD_SUMMARY` (1.3); `createEventStream` (1.4) + handlers (1.7); `useAuthStore` (token).
- Produces: `useRealtime()` — no `onMounted`, carrega dados iniciais (REST/GraphQL) e abre o SSE com o JWT (`createEventStream(authStore.accessToken, e=>dispatch(e,handlers))`); fecha no `onUnmounted`.

- [ ] **Step 1: useRealtime.ts** — orquestra carga inicial + SSE; cards de resumo via `DASHBOARD_SUMMARY`.
- [ ] **Step 2: DashboardPage.vue** — GridLayout com DashboardCards (summary) + ChargesTable + PaymentsList + InvoiceCard + TimelineFeed + NotificationHost.
- [ ] **Step 3: Verificação manual end-to-end** — subir infra (`docker compose up -d mongo rabbitmq`) + api (:3100) + web (:5173/3101); login; criar charge; ver status/timeline atualizando em tempo real via SSE.
- [ ] **Step 4: Commit** — `feat(web): dashboard em tempo real (summary + SSE + painéis)`

---

# FASE 2 — Checkout / Payment Link

Referência: `docs/superpowers/specs/2026-06-28-checkout-payment-link-design.md`, `docs/01-domain/payment-link.md`, `docs/03-frontend/checkout.md`.

## Task 2.1: Charge — paymentLinkToken + método opcional + transição

**Files:**
- Modify: `apps/api/src/modules/charges/domain/entities/charge.entity.ts`
- Modify: `apps/api/src/modules/charges/infrastructure/database/charge.schema.ts` (campo + índice único `paymentLinkToken`; `paymentMethod` opcional)
- Test: `apps/api/src/modules/charges/domain/entities/charge.entity.spec.ts` (adições)

**Interfaces:**
- Produces: `Charge` com `paymentLinkToken: string`, `paymentMethod: PaymentMethod | null`; `Charge.create(...)` aceita método opcional e gera token (ou recebe token gerado pelo use-case); método `selectMethodAndRequestPayment(method): void` (guarda: só se status aberto e método ainda não definido; senão `ConflictError`).

- [ ] **Step 1: Teste falhando** — entidade: `selectMethodAndRequestPayment('pix')` em charge pending seta método; em charge `paid`/já com método → `ConflictError`.
- [ ] **Step 2: Run** `npm run test --workspace @payment-flow/api` (de apps/api) → FAIL.
- [ ] **Step 3: Implementar** campo, token (via `randomUUID().replace(/-/g,'')`), método opcional, transição com guarda.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(api): charge com paymentLinkToken e método opcional`

## Task 2.2: create-charge não auto-dispara + gera token

**Files:**
- Modify: `apps/api/src/modules/charges/application/use-cases/create-charge.use-case.ts`
- Test: `apps/api/src/modules/charges/application/use-cases/create-charge.use-case.spec.ts` (novo)

**Interfaces:**
- Consumes: `Charge` (2.1), `EventBusService`, `CHARGE_REPOSITORY`.
- Produces: `CreateChargeUseCase.execute(input)` — método agora OPCIONAL no input; gera token; persiste `pending` sem método; emite `charge.created.v1`; **não** emite `charge.payment_requested.v1`. Output inclui `paymentLinkToken`.

- [ ] **Step 1: Teste falhando** — mock repo+eventBus: após `execute`, `eventBus.publish` chamado com `charge.created.v1` e **nunca** com `charge.payment_requested.v1`; output tem `paymentLinkToken`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar** — remover emissão de `ChargePaymentRequestedEvent` do create; gerar token; método opcional.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(api): create-charge gera link e não auto-paga`

## Task 2.3: Repo findByPaymentLinkToken

**Files:**
- Modify: `apps/api/src/modules/charges/domain/repositories/charge-repository.interface.ts`
- Modify: `apps/api/src/modules/charges/infrastructure/repositories/mongo-charge.repository.ts`

**Interfaces:**
- Produces: `IChargeRepository.findByPaymentLinkToken(token): Promise<Charge | null>` + impl Mongo (`findOne({ paymentLinkToken })` lean → toDomain).

- [ ] **Step 1: Implementar** método na interface + impl.
- [ ] **Step 2: Atualizar mocks** dos specs existentes de charges que tipam `jest.Mocked<IChargeRepository>` (adicionar `findByPaymentLinkToken: jest.fn()`).
- [ ] **Step 3: Run testes** → PASS.
- [ ] **Step 4: Commit** — `feat(api): lookup de charge por paymentLinkToken`

## Task 2.4: get-charge-by-token (view pública)

**Files:**
- Create: `apps/api/src/modules/charges/application/use-cases/get-charge-by-token.use-case.ts`
- Test: idem `.spec.ts`

**Interfaces:**
- Consumes: `CHARGE_REPOSITORY`.
- Produces: `GetChargeByTokenUseCase.execute(token): Promise<PublicChargeView>` onde `PublicChargeView = { amount, currency, description?, status, availableMethods: PaymentMethod[], customerName?: string }`. Token inexistente → `NotFoundError`. `availableMethods = ['pix','boleto','credit_card']`.

- [ ] **Step 1: Teste falhando** — mock repo: token válido → view só com campos seguros; token inexistente → `NotFoundError`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(api): view pública da cobrança por token`

## Task 2.5: confirm-payment-link

**Files:**
- Create: `apps/api/src/modules/charges/application/use-cases/confirm-payment-link.use-case.ts`
- Test: idem `.spec.ts`

**Interfaces:**
- Consumes: `CHARGE_REPOSITORY`, `EventBusService`, `Charge.selectMethodAndRequestPayment`.
- Produces: `ConfirmPaymentLinkUseCase.execute({ token, method }): Promise<{ status: string }>` — carrega por token (404 se ausente), aplica transição (409 se não-aguardando via `ConflictError`), persiste, emite `charge.payment_requested.v1` com `{ customerId, amount, method }`. Retorna status.

- [ ] **Step 1: Teste falhando** — charge pending → emite `charge.payment_requested.v1` com método; charge terminal → `ConflictError`; token inexistente → `NotFoundError`.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar.**
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** — `feat(api): confirm do payment link dispara o pagamento`

## Task 2.6: Controller público REST

**Files:**
- Create: `apps/api/src/modules/charges/presentation/public/public-charges.controller.ts`, `apps/api/src/modules/charges/presentation/public/dtos/confirm-payment.dto.ts`
- Modify: `apps/api/src/modules/charges/charges.module.ts` (registrar controller + use-cases)

**Interfaces:**
- Consumes: `GetChargeByTokenUseCase` (2.4), `ConfirmPaymentLinkUseCase` (2.5).
- Produces: `GET /pay/:token` (sem guard) → view pública; `POST /pay/:token/confirm` body `ConfirmPaymentDto { method: 'pix'|'boleto'|'credit_card' }` (`@IsEnum`) → 400 inválido. **Sem** JwtAuthGuard/PermissionsGuard.

- [ ] **Step 1: Implementar** controller + DTO; registrar no module.
- [ ] **Step 2: build** → passa.
- [ ] **Step 3: Smoke manual** — criar charge (dash/REST autenticado) → pegar token → `GET /pay/:token` (sem auth) 200 → `POST /pay/:token/confirm {method:"pix"}` → status muda; ver charge virar paid (simulator).
- [ ] **Step 4: Commit** — `feat(api): endpoints públicos do payment link`

## Task 2.7: SSE público por token

**Files:**
- Modify: `apps/api/src/infra/sse/sse.service.ts` (`streamForCharge(chargeId)`)
- Create: `apps/api/src/modules/charges/presentation/public/public-charge-sse.controller.ts`, `.../public/link-token.guard.ts`
- Modify: `charges.module.ts` (importa SseModule; registra controller+guard)
- Test: `apps/api/src/infra/sse/sse.service.spec.ts` (streamForCharge filtra por chargeId)

**Interfaces:**
- Consumes: `SseService`, `CHARGE_REPOSITORY` (guard valida token→charge).
- Produces: `SseService.streamForCharge(chargeId): Observable<MessageEvent>` (filtra o Subject global por `payload.chargeId`/`data.chargeId`); `GET /pay/:token/stream` (`@Sse`) protegido por `LinkTokenGuard` (valida `:token` via repo; 404/401 se inválido).

- [ ] **Step 1: Teste falhando** — `streamForCharge('c1')` só emite eventos cujo chargeId é 'c1' (push 2 eventos, 1 de outra charge).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implementar** filtro rxjs + controller SSE + guard de token.
- [ ] **Step 4: Run** → PASS; build → passa.
- [ ] **Step 5: Commit** — `feat(api): SSE público filtrado por payment link`

## Task 2.8: Ajustar testes/smoke afetados pela mudança de create-charge

**Files:**
- Modify: specs/smoke que assumiam auto-pagamento ao criar charge.

**Interfaces:**
- Produces: suíte verde refletindo o novo modelo (charge criada fica `pending` até confirm).

- [ ] **Step 1: Rodar a suíte** (de apps/api) e identificar specs que assumem auto-pay.
- [ ] **Step 2: Ajustar** asserts (charge nasce pending; pagamento só após confirm). Não enfraquecer cobertura — adaptar ao novo fluxo.
- [ ] **Step 3: Run** → PASS (todos).
- [ ] **Step 4: Commit** — `test(api): adapta testes ao fluxo de payment link`

## Task 2.9: Frontend — rota pública + CheckoutLayout

**Files:**
- Modify: `apps/web/src/router/index.ts` (`/pay/:token` público, CheckoutLayout)
- Create: `apps/web/src/services/checkout.service.ts`
- Test: `apps/web/src/services/checkout.service.spec.ts`

**Interfaces:**
- Consumes: `http` (sem JWT obrigatório p/ as rotas públicas).
- Produces: `checkout.service` (`getByToken(token)`→view pública; `confirm(token,method)`; `streamUrl(token)`→`${VITE_API_URL}/pay/${token}/stream`).

- [ ] **Step 1: Teste falhando** — `getByToken` faz `GET /pay/:token` e desembrulha a view.
- [ ] **Step 2: Run** → FAIL → implementar → PASS.
- [ ] **Step 3: Rota** `/pay/:token` pública (sem guard).
- [ ] **Step 4: Commit** — `feat(web): rota pública e service do checkout`

## Task 2.10: Frontend — página de Checkout

**Files:**
- Create: `apps/web/src/pages/CheckoutPage.vue`, `apps/web/src/components/checkout/{ChargeSummaryCard,MethodSelector,CheckoutStatus,CardFormFake,PixArtifactFake,BoletoArtifactFake}.vue`

**Interfaces:**
- Consumes: `checkout.service` (2.9); `EventSource` direto na `streamUrl(token)`; `@vueuse/motion`.
- Produces: `CheckoutPage` — estados carregando→aguardando→processando→aprovado|falhou|expirado; carrega view, mostra seletor de método + artefato fake, confirma, abre SSE público e reflete o desfecho.

- [ ] **Step 1: Implementar** componentes + page (estado local de página, sem Pinia global).
- [ ] **Step 2: SSE** — conectar `streamUrl`, atualizar status; reconnect on error.
- [ ] **Step 3: Verificação manual end-to-end** — dash cria charge → copia link → abrir `/pay/:token` em aba anônima → escolher método → confirmar → ver "processando" → aprovado em tempo real; conferir no dashboard que a timeline/charge refletem.
- [ ] **Step 4: Commit** — `feat(web): página de checkout (jornada de pagamento)`

## Task 2.11: Dashboard mostra o link na criação

**Files:**
- Modify: `apps/web/src/components/charges/CreateChargeDialog.vue` (ou ChargesTable) — exibir/copys `/pay/:token` após criar.

**Interfaces:**
- Consumes: `paymentLinkToken` no retorno de `charges.service.create`.
- Produces: UI copiável do link de pagamento.

- [ ] **Step 1: Implementar** exibição + botão copiar (monta URL `${window.location.origin}/pay/${token}`).
- [ ] **Step 2: Commit** — `feat(web): dashboard exibe o link de pagamento`

---

# Self-Review (cobertura do spec)

- Dashboard (stack, painéis, stores, SSE autenticado, GraphQL summary, animações): Tasks 1.1–1.14. ✔
- Checkout backend (token, método opcional, no-auto-pay, view pública, confirm, SSE público): Tasks 2.1–2.7. ✔
- Impacto em testes existentes (no-auto-pay): Task 2.8. ✔
- Checkout frontend (rota pública, page, link no dash): Tasks 2.9–2.11. ✔
- Edge cases (404/409/400/expired) cobertos em 2.4/2.5/2.6/2.10. ✔
