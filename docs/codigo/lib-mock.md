# `lib/mock.ts`

Arquivo-fonte: [lib/mock.ts](../../lib/mock.ts)

## Responsabilidade

Fornece dados simulados para desenvolvimento sem Supabase.

## Casos cobertos

- Unidade com espera.
- Unidade sem relatos.
- Unidade com viagem estimada.
- Ordenação por tempo total.

`mockResposta` recebe latitude e longitude e gera `origem` com esses valores. Para cada unidade calcula `total_min` e ordena a lista.
