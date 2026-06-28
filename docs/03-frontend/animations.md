# Animations Layer (Frontend)

## Visão Geral

Este documento define a estratégia de animações no frontend do Payment Flow.

O objetivo é transformar o dashboard em uma interface **viva e reativa**, refletindo eventos em tempo real com feedback visual claro.

---

# Princípio principal

> Animação não é decoração — é feedback de estado do sistema.

---

# Stack de animação

## 👉 Escolha principal

### @vueuse/motion

```bash
npm install @vueuse/motion
```

---

## Por que essa escolha?

- nativa para Vue 3
- integra com reatividade (Pinia + SSE)
- leve e performática
- ideal para dashboards em tempo real
- sintaxe simples e declarativa

---

# Fluxo de animação no sistema

```text id="anim_flow1"
SSE Event recebido

↓

Store atualizado (Pinia)

↓

Componente re-renderiza

↓

Motion aplica animação

↓

UI atualizada visualmente
```

---

# Tipos de animação no sistema

---

## 1. Entrada de elementos (Enter Animations)

Usado quando novos dados chegam via SSE.

### Exemplo

```vue id="anim_enter1"
<div
  v-motion
  :initial="{ opacity: 0, y: 15 }"
  :enter="{ opacity: 1, y: 0 }"
>
  Charge criada
</div>
```

---

## 2. Atualização de status (State Change)

Usado quando um estado muda (pending → paid).

```vue id="anim_state1"
<div
  v-motion
  :initial="{ scale: 1 }"
  :enter="{ scale: 1.05 }"
  :leave="{ opacity: 0.5 }"
>
  Payment Approved
</div>
```

---

## 3. Timeline animation

Eventos fluindo em tempo real.

```vue id="anim_timeline1"
<div
  v-for="event in timeline"
  :key="event.id"
  v-motion
  :initial="{ opacity: 0, x: -20 }"
  :enter="{ opacity: 1, x: 0 }"
>
  {{ event.type }}
</div>
```

---

## 4. Notificações (Toasts)

Entrada e saída suave.

- slide in
- fade out
- auto dismiss

---

## 5. Cards de dashboard

Atualizações de métricas:

- total de payments
- charges criadas
- invoices emitidas

---

# Integração com SSE

## Regra principal

> Toda animação é consequência de um evento SSE.

---

## Fluxo real

```text id="anim_sse1"
Backend Event
  ↓
SSE Stream
  ↓
Pinia Store
  ↓
Vue Re-render
  ↓
Motion Animation
```

---

# Boas práticas

## 1. Não animar tudo

- apenas mudanças relevantes
- evitar poluição visual

---

## 2. Animações curtas

- 150ms a 300ms ideal
- evitar delays longos

---

## 3. Consistência

- mesma linguagem visual em todo sistema
- mesmos padrões de entrada/saída

---

## 4. Performance

- evitar animações em listas grandes sem virtualização
- manter DOM leve

---

# Onde usar animação no Payment Flow

## Charges

- criação de charge
- mudança de status

---

## Payments

- processamento
- aprovação/falha

---

## Invoices

- emissão
- disponibilidade

---

## Timeline

- entrada contínua de eventos

---

## Notifications

- toast system animado

---

# Benefícios

- sensação de sistema vivo
- feedback imediato ao usuário
- melhor UX em dashboards financeiros
- clareza de eventos em tempo real

---

# Stack final do frontend

```text id="anim_stack1"
Vue 3
+ TypeScript
+ TailwindCSS
+ shadcn-vue
+ Pinia
+ SSE
+ @vueuse/motion
+ lucide-vue-next
```

---

# Resultado esperado

Com essa camada:

- dashboard deixa de ser estático
- eventos viram experiência visual
- usuário entende o fluxo sem ler texto
- sistema parece “Stripe-like”
```