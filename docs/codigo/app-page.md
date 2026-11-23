# `app/page.tsx`

Arquivo-fonte: [app/page.tsx](../../app/page.tsx)

## Responsabilidade

Componente principal da aplicação. Ele conecta localização do navegador, carregamento das unidades, mapa, lista, carrossel mobile e formulário de relato.

## Estruturas principais

- `MapView`: importado dinamicamente com `ssr: false`, necessário porque Leaflet usa APIs do navegador.
- `LoadingScreen`: tela de carregamento mínima de 2,2 segundos com animação de progresso e ambulância.
- Estado `dados`: resposta completa de `GET /api/unidades`.
- Estado `relatando`: unidade selecionada para o formulário.
- Estado `selecionada`: identificador selecionado para interação entre lista e mapa.
- Estado `indiceUnidade`: unidade exibida no carrossel móvel.
- Estado `tentativa`: dispara recarregamento após enviar relato ou clicar em tentar novamente.

## Fluxo

1. `useGeolocation` obtém posição ou um estado de GPS.
2. `buscarUnidades(pos.lat, pos.lng)` consulta a API.
3. As unidades já chegam ordenadas pelo servidor e são exibidas sem nova ordenação no front.
4. Em telas pequenas, apenas uma unidade do carrossel é exibida.
5. Em telas maiores, todas as unidades aparecem em uma lista lateral.
6. Ao confirmar um relato, `tentativa` aumenta e os dados são recarregados.

## Localização e mapa

Enquanto o GPS está carregando, a página ainda usa `CENTRO_PADRAO`. Ao negar ou indisponibilizar o GPS, exibe um aviso e continua com esse centro.

## Gestos móveis

`iniciarArraste` guarda o toque inicial e `finalizarArraste` reconhece deslizamento horizontal com pelo menos 40 px e prevalência sobre o movimento vertical.

## Pontos de atenção

- `selecionarUnidade` está declarado mas não é usado no fluxo atual.
- A tela só sai do carregamento após existir resposta/erro e completar os 2,2 segundos.
- O front confia na ordenação da API.
- O estado `selecionada` usa dois formatos históricos no código: atualmente o card seta apenas `string`, enquanto o mapa recebe um objeto em `Props`. Isso precisa ser corrigido de forma consistente na versão seguinte.
