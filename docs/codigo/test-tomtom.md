# `lib/tomtom.test.ts`

Arquivo-fonte: [lib/tomtom.test.ts](../../lib/tomtom.test.ts)

## Cobertura

Testa conversão de resultados, cache, pausa após erro e limitação dos destinos.

Pontos principais:

- 750 segundos viram 13 minutos.
- 5300 metros viram 5,3 km.
- Sem chave não há requisição.
- Uma chamada atende vários destinos.
- Apenas 12 unidades próximas são consultadas.
- Célula sem rota não entra no Map.
- Origem na mesma grade reutiliza cache.
- 403 pausa por dez minutos.
- 429 pausa por 30 segundos e permite nova tentativa depois.
