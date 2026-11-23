# `lib/estimativa.ts`

Arquivo-fonte: [lib/estimativa.ts](../../lib/estimativa.ts)

## Responsabilidade

Concentra a regra de espera em funções puras.

## `mediana`

Recebe números, copia o array e ordena numericamente. Para quantidade ímpar retorna o valor central; para quantidade par retorna a média dos dois centrais.

Usar a mediana evita que um valor extremo distorça muito o resultado.

## `calcularEspera`

Recebe relatos e o relógio atual opcional.

Um relato entra no cálculo quando:

- A data é válida.
- Foi criado há até 3 horas.
- `minutos` é inteiro entre 1 e 720.

Sem relatos válidos, devolve `espera_min: null`, `n_relatos: 0` e `ultimo_relato_em: null`.

Datas futuras são toleradas para sincronização de relógios, pois não há limite superior na verificação.
