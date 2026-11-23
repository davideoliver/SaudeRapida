# `lib/api-client.ts`

Arquivo-fonte: [lib/api-client.ts](../../lib/api-client.ts)

## Responsabilidade

Centraliza chamadas HTTP feitas pelo navegador.

## Modo mock

`NEXT_PUBLIC_USE_MOCK === "true"` faz `buscarUnidades` e `enviarRelato` usarem dados locais em vez da API. Esta variável é pública e não contém segredo.

## Funções

- `buscarUnidades(lat, lng)`: faz GET com coordenadas na query.
- `enviarRelato(relato)`: faz POST com JSON.
- `lerErro`: converte erro JSON em `ErroDaApi`; resposta não JSON vira `erro_interno`.

O tipo `ErroDaApi` inclui `status`, embora `ErroApi` do contrato não contenha esse campo. Ele é usado apenas no cliente.
