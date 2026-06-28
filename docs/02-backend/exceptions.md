# Exceptions Layer

## Visão Geral

Este documento define como o Payment Flow trata erros de forma padronizada no backend.

O objetivo é garantir consistência em todas as respostas de erro da API.

---

# Princípio principal

> Todo erro deve ser previsível, estruturado e rastreável.

---

# Tipos de erro

## 1. Domain Errors

Erros gerados pelo domínio.

Exemplo:

- Charge já cancelada
- Payment inválido
- Customer inativo

---

## 2. Application Errors

Erros de regra de caso de uso.

Exemplo:

- Customer não encontrado
- Charge expirada
- Payment já processado

---

## 3. Infrastructure Errors

Erros técnicos.

Exemplo:

- MongoDB indisponível
- RabbitMQ offline
- Timeout externo

---

## 4. Validation Errors

Erros de entrada (DTO).

---

# Estrutura padrão de erro

```json id="ex_err1"
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Charge is already expired",
  "code": "CHARGE_EXPIRED",
  "timestamp": "2026-06-28T10:00:00Z",
  "path": "/charges",
  "correlationId": "uuid"
}
```

---

# Exception base

## BaseException

```ts id="ex_base1"
export class BaseException extends Error {
  constructor(
    public readonly message: string,
    public readonly code: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}
```

---

# Domain Exceptions

## ChargeExpiredException

```ts id="ex_domain1"
export class ChargeExpiredException extends BaseException {
  constructor() {
    super(
      'Charge is already expired',
      'CHARGE_EXPIRED',
      400,
    );
  }
}
```

---

## PaymentAlreadyProcessedException

```ts id="ex_domain2"
export class PaymentAlreadyProcessedException extends BaseException {
  constructor() {
    super(
      'Payment already processed',
      'PAYMENT_ALREADY_PROCESSED',
      409,
    );
  }
}
```

---

# Global Exception Filter

## Responsabilidade

Centralizar todos os erros da aplicação.

```ts id="ex_filter1"
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const status = exception.statusCode || 500;

    response.status(status).json({
      statusCode: status,
      message: exception.message || 'Internal error',
      code: exception.code || 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    });
  }
}
```

---

# Correlation ID

Todos os erros incluem rastreabilidade:

```text id="ex_corr1"
Request → UseCase → Domain → Error → Response
```

---

# Mapeamento de erros

## Domain → HTTP

| Domain Error | HTTP Status |
|-------------|------------|
| Invalid Charge | 400 |
| Not Found | 404 |
| Conflict | 409 |
| Internal | 500 |

---

# Estratégia de erro

## 1. Fail Fast

Erros devem ser lançados imediatamente.

---

## 2. Explicit Errors

Nada de `return null` para erro.

Sempre:

```ts
throw new ChargeExpiredException();
```

---

## 3. Centralização

Somente o filter converte erro em resposta HTTP.

---

# Integração com arquitetura

## REST

Erros são convertidos automaticamente em JSON padronizado.

---

## GraphQL

Erros são mapeados para formato GraphQL padrão.

---

## SSE

Erros não interrompem stream, mas são emitidos como eventos.

---

## RabbitMQ

Erros podem gerar:

- retry
- DLQ (dead letter queue)

---

# Logging

Todos os erros são logados com:

- correlationId
- stack trace
- contexto da requisição

---

# Boas práticas

- Nunca retornar erro “cru”
- Nunca usar string solta como erro
- Sempre usar exceptions tipadas
- Sempre incluir código de erro
- Sempre rastrear com correlationId

---

# Resultado esperado

Com essa camada:

- API fica previsível
- debugging fica simples
- sistema fica observável
- erros deixam de ser caos

---

# Próximo documento

```
authentication.md
```

Aqui vamos detalhar o sistema completo de autenticação JWT do backend.
```