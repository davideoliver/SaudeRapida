# `components/UnidadeCard.tsx`

Arquivo-fonte: [components/UnidadeCard.tsx](../../components/UnidadeCard.tsx)

## Responsabilidade

Exibe uma unidade em formato de card com espera, viagem e tempo total.

## Dados

Usa `Pick<Unidade>` para aceitar apenas os campos necessários à apresentação. Isso evita acoplamento acidental a dados que o card não usa.

## Comportamento visual

- Nome e endereço da unidade.
- `sem relatos recentes` quando `espera_min === null`.
- Selo `estimado` quando o tempo de viagem veio do fallback.
- Tempo total em verde abaixo de 40 minutos e vermelho a partir de 40 minutos.
- Seleção visual por borda vermelha e indicação `aria-pressed`.

## Interações

- Clique no card chama `onSelecionar`.
- Clique em informar espera chama `onInformarEspera` e usa `stopPropagation` para não selecionar novamente.
