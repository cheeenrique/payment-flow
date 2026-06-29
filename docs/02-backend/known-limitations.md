# Limitações Conhecidas e Follow-ups

Decisões e dívidas técnicas conscientes do projeto. Não são bugs — são pontos onde a implementação atual é adequada ao estágio (dashboard de operador single-account + simulação), mas exigiriam evolução em cenários mais amplos.

---

## 1. SSE autenticado é broadcast global (sem particionamento por conta) — [Importante]

### O que é

O stream autenticado do dashboard (`GET /events/stream`) usa um único `Subject` RxJS global em `apps/api/src/infra/sse/sse.service.ts`. O método `stream()` entrega **todos** os domain events do sistema para **toda** conexão autenticada — charges, payments e invoices de qualquer cliente, com payload completo (valores, `customerId`).

```ts
emit(event)  // events$.next(event)        — uma fila global
stream()     // events$.asObservable()      — a mesma fila para todos os clientes, sem filtro
```

### Por que NÃO é um vazamento no estado atual

- O modelo de dados **não tem conceito de tenant/conta/owner**. Não existe campo pelo qual filtrar.
- `customer` é o **pagador** (dado de negócio), não uma conta de acesso ao dashboard.
- Há um único espaço lógico de operador. É um painel interno (estilo dashboard do Stripe), que por definição mostra **toda a atividade da conta**.
- Logo, broadcast entre operadores autenticados é o comportamento **correto** para um sistema single-account.

### RBAC não cobre isto

Os papéis (`viewer`/`operator`/`admin`) controlam **quais ações** são permitidas, não **qual subconjunto de dados** cada um vê. Um `viewer` continua recebendo todos os eventos. RBAC ≠ particionamento de dados.

### Quando vira risco real

Ao introduzir **multi-tenancy** (várias empresas/contas compartilhando a mesma instância). Nesse momento, filtrar o stream por conta passa a ser **obrigatório** — caso contrário, operador da conta A receberia eventos da conta B (vazamento cross-tenant, classe IDOR / OWASP A01).

### Caminho de correção (quando necessário)

Mesmo padrão do `streamForCharge(chargeId)` que já existe (filtro RxJS por campo do payload):

1. Adicionar `accountId`/`ownerId` às entidades (migração de schema).
2. Propagar esse campo no payload de cada `sseService.emit`.
3. Expor `streamForAccount(accountId)` e, no controller do stream autenticado, filtrar por `request.user` (o JWT já carrega o usuário).

Esforço médio; encaixa na arquitetura atual sem reescrita.

---

## 2. Token JWT no query param do SSE — [Baixo, tradeoff aceito]

`EventSource` (browser) não envia headers customizados, então o stream autenticado recebe o JWT via `?token=<jwt>`. Tokens em URL podem vazar por logs de proxy/servidor, header `Referer` e histórico do browser.

**Mitigações recomendadas:** TTL curto no access token (5–15 min, já é 15m), não logar a query string completa no proxy/logger, e considerar cookie httpOnly se um dia trocar `EventSource` por fetch-stream. É um tradeoff inerente ao SSE com `EventSource`.

---

## 3. Outros follow-ups de menor severidade

- **Refresh token automático no frontend:** o interceptor de resposta já desloga em 401 (`apps/web/src/services/http.ts`), mas não há renovação automática via refresh token — após expirar, o usuário refaz login. Suficiente para JWT short-lived; renovação transparente fica como melhoria.
- **Carga inicial de payments no dashboard:** não há endpoint REST global `GET /payments` (pagamentos são consultados por charge). No dashboard, pagamentos chegam via SSE; uma listagem global inicial exigiria um endpoint/uso novo.
- **Delays do simulador via `setTimeout`/agendamento:** vereditos com atraso são persistidos (`ScheduledVerdict`) e processados por cron (durável a restart). O delay imediato (pix) é inline. Não usa delayed-exchange do RabbitMQ — suficiente para o objetivo didático.
- **Reconnect do SSE no checkout:** usa delay fixo; o stream do dashboard usa backoff exponencial. Unificar num util compartilhado é um polish pendente.

---

Estas limitações estão registradas conscientemente. Nenhuma bloqueia o uso do sistema no escopo atual (plataforma educacional / single-account).
