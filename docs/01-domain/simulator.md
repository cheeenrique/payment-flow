# Simulator Module

## Visão Geral

O módulo **Simulator** é responsável por reproduzir comportamentos reais de sistemas de pagamento dentro do Payment Flow.

Ele permite simular cenários como:

- atrasos de processamento
- falhas de pagamento
- aprovação automática
- expiração de cobranças
- instabilidade de serviços
- comportamento assíncrono

---

# Responsabilidade do módulo

O Simulator Module é responsável por:

- Simular delays em pagamentos
- Simular falhas e sucessos
- Controlar regras de aprovação
- Disparar eventos artificiais
- Testar fluxo completo do sistema
- Aumentar realismo do ambiente

---

# Fora do escopo

Este módulo NÃO é responsável por:

- Regras reais de negócio
- Persistência de dados principais
- Autenticação
- Gestão de clientes
- Processamento financeiro real

---

# Conceito central

O Simulator atua como um **motor de comportamento controlado**.

Ele interfere diretamente nos fluxos de:

- Charges
- Payments
- Invoices

---

# Tipos de simulação

## PIX

- aprovação instantânea
- delay configurável (ms a segundos)
- expiração automática
- falha aleatória controlada

---

## Boleto

- compensação atrasada (ex: 5 min simulados)
- processamento assíncrono via worker
- possibilidade de não pagamento
- expiração automática

---

## Cartão de crédito

- taxa de aprovação configurável
- simulação de risco
- simulação de saldo insuficiente
- falhas intermitentes

---

# Fluxo principal

## Simulação de pagamento

```text id="sim_flow1"
Charge criada

↓

Simulator intercepta fluxo

↓

Define comportamento:

   ├── delay
   ├── success rate
   ├── failure probability
   └── timeout rules

↓

Payment Module processa normalmente

↓

Simulator influencia resultado

↓

Eventos são gerados normalmente
```

---

# Configuração de simulação

## Exemplo de configuração global

```json id="sim_cfg1"
{
  "pix": {
    "successRate": 0.95,
    "maxDelayMs": 3000
  },
  "boleto": {
    "delayMs": 300000,
    "successRate": 0.90
  },
  "creditCard": {
    "successRate": 0.80,
    "riskFactor": 0.3
  }
}
```

---

# Endpoints (REST - Command Side)

## POST /simulator/config

Atualiza regras de simulação.

---

## GET /simulator/config

Consulta configuração atual.

---

## POST /simulator/trigger

Dispara simulação manual.

---

## POST /simulator/reset

Reseta comportamento padrão.

---

# Eventos gerados

O Simulator pode emitir eventos artificiais:

- simulator.payment.delay
- simulator.payment.force_success
- simulator.payment.force_failure
- simulator.charge.expired
- simulator.inject_error

---

# Integração com sistema

## Charges

- pode alterar tempo de expiração
- pode forçar status

---

## Payments

- influencia aprovação/falha
- controla tempo de processamento

---

## Invoices

- pode atrasar emissão
- pode simular falhas fiscais

---

## Timeline

- registra todas interferências do simulator

---

## Notifications

- dispara alertas de comportamento simulado

---

# Integração com RabbitMQ

Simulator atua como:

- producer de eventos artificiais
- interceptor de fluxos existentes
- injetor de comportamento em consumers

---

# Integração com SSE

Permite visualizar em tempo real:

- atraso simulado
- falhas acontecendo
- aprovação automática
- mudanças de estado

---

# Regras de simulação

- Simulação não altera regras de domínio
- Apenas influencia comportamento
- Deve ser configurável em runtime
- Deve ser reversível
- Não pode quebrar integridade dos dados

---

# Casos de uso

## 1. Teste de falha em pagamento

- simular falha de cartão
- validar fluxo de retry
- verificar notificação

---

## 2. Teste de boleto atrasado

- simular delay de 5 minutos
- validar worker
- validar expiração

---

## 3. Teste de sistema em carga

- aumentar taxa de falha
- observar comportamento do sistema

---

# Importância no sistema

O Simulator é o que transforma o Payment Flow em um:

> **laboratório de engenharia de software**

Ele permite testar:

- resiliência
- consistência
- eventos
- arquitetura distribuída

---

# Resultado esperado

Ao final deste módulo teremos:

- ambiente altamente testável
- simulação realista de sistemas financeiros
- controle total de comportamento do sistema
- base para estudos avançados de arquitetura

---

# Conclusão do domínio

Com o Simulator concluímos o módulo:

```
01-domain/
```

Agora o sistema possui:

- autenticação
- clientes
- cobrança
- pagamento
- invoice
- notificações
- timeline
- simulação

---

# Próximo passo

```
02-backend/
```

Aqui começaremos a implementação real no NestJS:

- estrutura de módulos
- arquitetura de código
- padrões de projeto
- organização de pastas
```