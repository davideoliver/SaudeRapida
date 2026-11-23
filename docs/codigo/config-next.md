# `next.config.ts`

Arquivo-fonte: [next.config.ts](../../next.config.ts)

## Responsabilidade

Configura recursos do Next e integração de CSS.

- `cacheComponents: true`: versão usa cacheComponents; não devem ser usados exports antigos de cache em rotas.
- `partialPrefetching: true`.
- `experimental.agentFeedback: true`.
- Turbopack usa loader Tailwind para arquivos CSS.
