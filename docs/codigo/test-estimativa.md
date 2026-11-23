# `lib/estimativa.test.ts`

Arquivo-fonte: [lib/estimativa.test.ts](../../lib/estimativa.test.ts)

## Cobertura

Testa mediana, janela de três horas, limites dos minutos, datas inválidas e ausência de efeitos colaterais.

O relógio é fixado em `2026-11-21T18:00:00Z`, garantindo testes determinísticos.

## Cenários-chave

- Mediana ímpar e par.
- Ordenação numérica.
- Troll de 600 ignorado no resultado da unidade 1.
- Exclusão do limite 3 h + 1 minuto.
- Inclusão exatamente às 3 horas.
- Limites 1 e 720.
- Relatos inválidos misturados com válidos.
- Nenhum relato válido resulta em `null`.
