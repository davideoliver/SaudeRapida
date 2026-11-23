# `app/layout.tsx`

Arquivo-fonte: [app/layout.tsx](../../app/layout.tsx)

## Responsabilidade

Define o layout raiz exigido pelo App Router e os metadados da página.

## Elementos

- Importa Geist e Geist Mono do Next.
- Cria variáveis CSS de fonte usadas por Tailwind e Leaflet.
- Importa `app/globals.css`.
- Define título e descrição para SEO e abas do navegador.
- Renderiza `<html lang="pt-BR">` e envolve a aplicação em `<body>`.

`LayoutProps<"/">` é o tipo de propriedades gerado pelo Next para a rota raiz.
