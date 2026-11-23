# `app/api/relatos/route.ts`

Arquivo-fonte: [app/api/relatos/route.ts](../../../app/api/relatos/route.ts)

## Responsabilidade

Implementa `POST /api/relatos` e valida, limita e registra relatos.

## Sequência

1. Lê o JSON com tratamento para corpo inválido.
2. Valida UUID de `unidade_id` e `device_id`.
3. Valida `minutos` como inteiro entre 1 e 720.
4. Confirma que a unidade existe e está ativa.
5. Procura relato recente do mesmo dispositivo na mesma unidade nos últimos 30 minutos.
6. Insere o relato e devolve o identificador.

## Status e códigos

- 422: `valor_invalido`.
- 404: `unidade_inexistente`.
- 429: `relato_recente`.
- 500: `erro_interno`.
- 201: sucesso com `{ ok: true, relato_id }`.

Todas as regras críticas são revalidadas no servidor. O front apenas melhora o feedback imediato.
