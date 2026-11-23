# `hooks/useGeolocation.ts`

Arquivo-fonte: [hooks/useGeolocation.ts](../../hooks/useGeolocation.ts)

## Responsabilidade

Obtém a posição aproximada do usuário pelo navegador.

## Estado

- `pos`: coordenada atual; começa em `CENTRO_PADRAO`, Sorocaba/SP.
- `estado`: `carregando`, `ok`, `negado` ou `indisponivel`.

## Configuração

`getCurrentPosition` usa timeout de 8 segundos e permite posição em cache por até 60 segundos.

## Tratamento de falhas

- Sem API de geolocalização: `indisponivel`.
- Permissão negada: `negado`.
- Outros erros: `indisponivel`.

O centro padrão permite o MVP continuar mesmo sem localização.
