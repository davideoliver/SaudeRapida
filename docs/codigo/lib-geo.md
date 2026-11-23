# `lib/geo.ts`

Arquivo-fonte: [lib/geo.ts](../../lib/geo.ts)

## Responsabilidade

Implementa cálculos geográficos puros e o fallback de rota.

## Fórmulas

- `haversineKm`: distância em linha reta na superfície da Terra.
- `estimarViagem`: aplica fator de desvio de 1,4 e velocidade média de 25 km/h.
- `parseCoordenada`: valida os parâmetros `lat` e `lng`.

## Regras do fallback

- Tempo mínimo de 1 minuto.
- Distância arredondada para uma casa decimal.
- Tempo arredondado para inteiro.
- Vazio, texto não numérico, `NaN`, `Infinity` e intervalos geográficos inválidos são rejeitados.
