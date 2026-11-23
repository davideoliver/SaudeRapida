# `lib/supabase.ts`

Arquivo-fonte: [lib/supabase.ts](../../lib/supabase.ts)

## Responsabilidade

Cria o cliente Supabase usado exclusivamente pelo servidor.

## Configuração

Lê `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`. Sem uma delas, lança erro.

Sessão persistida é desativada para operar no modelo serverless.

## Segurança

Este arquivo não deve ser importado por componentes ou páginas do navegador. A service role concede acesso administrativo ao banco e só pode existir no servidor.
