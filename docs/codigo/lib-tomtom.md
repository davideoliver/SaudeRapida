# `lib/tomtom.ts`

Arquivo-fonte: [lib/tomtom.ts](../../lib/tomtom.ts)

## Responsabilidade

Consulta a Matrix Routing API da TomTom pelo servidor e mantém cache em memória.

## Estratégia de custo

- Até 12 destinos mais próximos recebem cálculo com trânsito.
- Até 100 destinos são enviados por requisição.
- Cache dura 5 minutos.
- Cache é separado por unidade e por grade aproximada de origem de 500 m.
- Limite em memória: 500 entradas; ao atingir o limite, o código limpa todo o Map.

## Requisição

Envia uma origem, vários destinos, `traffic: "live"`, `travelMode: "car"` e `departAt: "now"`.

## Respostas

- `travelTimeInSeconds` vira minutos arredondados.
- `lengthInMeters` vira quilômetros com uma casa decimal.
- Células sem rota não são inseridas no resultado.
- A chamada usa timeout de 6 segundos.

## Falhas

- 429: pausa por 30 segundos.
- 403: pausa por 10 minutos.
- Outros erros, timeout ou JSON inválido: devolvem mapa vazio ou parcial.

O estado é específico de cada instância do servidor. Em ambiente distribuído, cada instância possui seu próprio cache.
