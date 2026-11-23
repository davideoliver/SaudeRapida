# `app/api/unidades/route.ts`

Arquivo-fonte: [app/api/unidades/route.ts](../../../app/api/unidades/route.ts)

## Responsabilidade

Implementa `GET /api/unidades?lat=&lng=` e monta a resposta completa do contrato.

## Sequência

1. Extrai latitude e longitude.
2. Valida por `parseCoordenada`; resposta inválida usa 400.
3. Consulta unidades ativas e relatos das últimas 3 horas em paralelo.
4. Obtém rotas com `buscarRotas`.
5. Agrupa relatos por unidade.
6. Calcula a mediana e monta `Unidade`.
7. Usa fallback geográfico para qualquer unidade sem rota TomTom.
8. Ordena por tempo total e desempata por distância.

## Fonte da viagem

- `transito`: TomTom encontrou uma rota.
- `estimado`: ausência de chave, falha, timeout, cota ou célula sem rota.

## Banco

Consulta `unidades` com `ativo = true` e `relatos` com `criado_em >= desde`.

Erros do Supabase retornam 500.
