# `components/MapView.tsx`

Arquivo-fonte: [components/MapView.tsx](../../components/MapView.tsx)

## Responsabilidade

Renderiza o mapa Leaflet, origem do usuário e marcadores das unidades.

## Configuração

- Usa tiles públicos do OpenStreetMap.
- Exibe atribuição `© OpenStreetMap contributors`.
- Configura manualmente os ícones padrão do Leaflet.
- Usa `CircleMarker` para representar a origem.
- Usa `Popup` com nome e tempo total de cada unidade.

## Componentes internos

- `Recentralizar`: recentra o mapa sempre que a origem muda.
- `AjustarTamanho`: observa o contêiner e recalcula o tamanho após layout ou resize.
- `AtualizarCamera`: deveria centralizar a unidade selecionada e usar animação `flyTo`.

## Interação

Cada marcador chama `onSelecionar(u.id)` ao ser clicado.

## Pontos de atenção

O tipo `Props` declara `selecionada`, mas `MapView` não recebe nem usa a prop na implementação atual; `AtualizarCamera` também não é renderizado. A seleção pela lista não centraliza o mapa neste estado do código. Para ativar esse comportamento, o componente pai deve passar um objeto com `id` e `solicitacao`, e `<AtualizarCamera ... />` deve ser renderizado.
