# Validation Layer

## Visão Geral

Este documento define como a validação de dados será feita no Payment Flow utilizando NestJS.

O objetivo é garantir que nenhuma entrada inválida chegue ao domínio.

---

# Princípio principal

> Validação acontece na borda do sistema.

Ou seja:

- Controllers validam entrada
- Domínio assume dados já válidos

---

# Ferramenta principal

## class-validator + class-transformer

Usados nos DTOs do NestJS.

---

# Fluxo de validação

```text id="val_flow1"
Request HTTP

↓

DTO (Validation Pipe)

↓

class-validator valida campos

↓

Se inválido → erro 400

↓

Se válido → Use Case
```

---

# Configuração global

## ValidationPipe

```ts id="val_pipe1"
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
);
```

---

# Regras importantes

## whitelist

Remove campos não definidos no DTO

## forbidNonWhitelisted

Rejeita requests com campos extras

## transform

Converte payload automaticamente para classes

---

# DTO padrão

## CreateChargeDto

```ts id="val_dto1"
export class CreateChargeDto {
  @IsString()
  customerId: string;

  @IsNumber()
  amount: number;

  @IsEnum(['pix', 'boleto', 'credit_card'])
  paymentMethod: string;

  @IsOptional()
  @IsString()
  description?: string;
}
```

---

# DTO de Customer

```ts id="val_dto2"
export class CreateCustomerDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  document: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
```

---

# Estratégia de validação por camada

## 1. Presentation (DTO)

- valida formato
- valida tipos
- valida estrutura

---

## 2. Application (Use Case)

- valida regras de negócio
- valida existência de entidades
- valida consistência

---

## 3. Domain

- invariantes finais
- regras críticas

---

# Exemplo completo

```text id="val_flow2"
Request inválido

↓

DTO bloqueia (400)

────────────────────

Request válido

↓

Use Case executa

↓

Domain valida regra

↓

Persistência ocorre
```

---

# Validação de regras complexas

Exemplo:

- charge só pode ser criada se customer existir
- paymentMethod deve ser compatível com charge

Isso NÃO fica no DTO.

---

# Custom validators

## Exemplo: validar documento

```ts id="val_custom1"
@ValidatorConstraint()
export class IsDocumentValid {
  validate(value: string) {
    return validateCPFOrCNPJ(value);
  }
}
```

---

# Pipes customizados

## ParseObjectIdPipe

```ts id="val_pipe2"
export class ParseObjectIdPipe implements PipeTransform {
  transform(value: string) {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    return value;
  }
}
```

---

# Erros de validação

## Formato padrão

```json id="val_err1"
{
  "statusCode": 400,
  "message": [
    "amount must be a number",
    "customerId should not be empty"
  ],
  "error": "Bad Request"
}
```

---

# Boas práticas

- DTO nunca contém regra de negócio
- Validação sempre explícita
- Nunca confiar em payload bruto
- Domínio recebe dados limpos
- Validação deve ser previsível

---

# Integração com arquitetura

## REST

Validação ocorre automaticamente

---

## GraphQL

Também usa pipes e decorators

---

## SSE

Não valida entrada (apenas saída)

---

# Segurança

Validação protege contra:

- injection de campos extras
- tipos inválidos
- payloads malformados
- ataques de estrutura

---

# Resultado esperado

Com essa camada:

- backend fica mais seguro
- domínio fica limpo
- erros são previsíveis
- API fica consistente

---

# Próximo documento

```
exceptions.md
```

Aqui vamos definir como o sistema lida com erros de forma padronizada e escalável.
```