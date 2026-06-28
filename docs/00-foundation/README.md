# Foundation

## Visão Geral

A pasta **00-foundation** contém os documentos base do Payment Flow.

Ela define todos os princípios iniciais do sistema antes da implementação de qualquer feature ou módulo.

Nenhuma decisão técnica ou de domínio deve ser tomada fora dos padrões definidos nesta seção.

---

## Objetivo desta seção

Estabelecer a base conceitual e arquitetural do projeto, incluindo:

- Visão do produto
- Arquitetura do sistema
- Stack tecnológica
- Glossário de termos

Esses documentos funcionam como a "fonte da verdade" inicial do sistema.

---

## Conteúdo

### 00-foundation contém:

- product-vision.md → O que é o produto e por que ele existe
- architecture.md → Como o sistema é estruturado
- technology-stack.md → Tecnologias escolhidas e justificativas
- glossary.md → Definições dos termos do domínio

---

## Regras da Fundação

As regras abaixo devem ser seguidas durante todo o projeto:

- Nenhuma feature pode ser criada sem respeitar a arquitetura definida aqui
- Nenhuma tecnologia pode ser adicionada sem justificar impacto arquitetural
- Todo conceito de domínio deve estar refletido no glossário
- Toda decisão relevante deve ser rastreável via documentação

---

## Ordem de leitura recomendada

1. product-vision.md
2. architecture.md
3. technology-stack.md
4. glossary.md

---

## Resultado esperado

Ao finalizar esta seção, qualquer desenvolvedor deve ser capaz de:

- Entender o propósito do sistema
- Entender como o sistema será estruturado
- Entender quais tecnologias serão usadas e por quê
- Entender os principais conceitos do domínio

---

## Próximo passo

Após esta seção, o próximo diretório será:

```
01-domain/
```

onde será definido todo o modelo de negócio do sistema.
```