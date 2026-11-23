# `.gitignore`

Arquivo-fonte: [.gitignore](../../.gitignore)

## Responsabilidade

Impede o versionamento de dependências, builds, ambientes locais, logs e arquivos temporários.

Pontos de segurança:

- `.env.local` e `.env` são ignorados.
- `/node_modules` e `/.next` não entram no repositório.
- `next-env.d.ts` e arquivos `.tsbuildinfo` são gerados.
