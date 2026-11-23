# `tests/unit/front/api-client.test.ts`

Arquivo-fonte: [tests/unit/front/api-client.test.ts](../../../tests/unit/front/api-client.test.ts)

## Cobertura

Testa o cliente HTTP com `fetch` global simulado.

Casos:

- Resposta 200 devolve o JSON.
- Erro 422 mantém `erro`, `mensagem` e `status`.
- Resposta HTML ou não JSON vira `erro_interno`.

O módulo é reimportado a cada teste porque o modo mock é fixado no import.
