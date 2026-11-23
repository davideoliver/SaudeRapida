# `types/unidade.ts`

Arquivo-fonte: [types/unidade.ts](../../types/unidade.ts)

## Responsabilidade

Espelha o contrato de dados da aplicação em TypeScript. É importado pelo front e pelo back.

## Constantes

`LIMITES` concentra regras compartilhadas: espera entre 1 e 720 minutos, janela de 3 horas, intervalo de 30 minutos e cache de 5 minutos em grade aproximada de 500 m.

## Tipos principais

- `FonteViagem`: `transito` ou `estimado`.
- `Unidade`: todos os campos exibidos por unidade.
- `Coordenada`: latitude e longitude.
- `RespostaUnidades`: origem usada e lista já ordenada.
- `NovoRelato`: campos enviados no POST.
- `RespostaRelato`: sucesso com identificador do relato.
- `CodigoErro` e `ErroApi`: formato único de erros.

Qualquer mudança de contrato deve alterar este arquivo e `docs/contrato.md` no mesmo Pull Request.
