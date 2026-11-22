import { LIMITES } from "@/types/unidade";

/**
 * Regras de negócio da espera. É uma FUNÇÃO PURA: recebe dados e devolve um resultado,
 * sem acessar banco, rede ou relógio do sistema. Por isso é fácil de testar.
 * (Não importe supabase aqui.)
 */

export type RelatoParaCalculo = {
  minutos: number;
  criado_em: string; // ISO 8601
};

export type ResultadoEspera = {
  /** Mediana exata (pode ser 37.5). A API arredonda para inteiro antes de responder. */
  espera_min: number | null;
  n_relatos: number;
  ultimo_relato_em: string | null;
};

/**
 * Mediana de uma lista com pelo menos 1 número.
 * Ímpar: o valor do meio. Par: a média dos dois do meio (igual ao percentile_cont(0.5) do Postgres).
 */
export function mediana(valores: number[]): number {
  if (valores.length === 0) {
    throw new Error("mediana() exige pelo menos um valor");
  }
  // ATENÇÃO: sort() sem função compara como TEXTO ("100" vem antes de "9").
  // O (a, b) => a - b força comparação numérica. A cópia [...valores] evita mexer no array original.
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 === 1
    ? ordenados[meio]
    : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

/**
 * Espera estimada de uma unidade, a partir dos relatos dela.
 * - Só entram relatos das últimas LIMITES.JANELA_RELATOS_HORAS horas (inclusive o limite exato).
 * - Só entram minutos inteiros entre MINUTOS_MIN e MINUTOS_MAX.
 * - Relatos com data inválida são ignorados.
 * - Sem relato válido: espera_min = null (nunca 0).
 *
 * `agora` é parâmetro (com padrão) para os testes poderem fixar o relógio.
 */
export function calcularEspera(
  relatos: RelatoParaCalculo[],
  agora: Date = new Date(),
): ResultadoEspera {
  const inicioDaJanela = agora.getTime() - LIMITES.JANELA_RELATOS_HORAS * 3_600_000;

  const validos: { minutos: number; t: number }[] = [];
  for (const r of relatos) {
    const t = Date.parse(r.criado_em);
    const dataOk = Number.isFinite(t) && t >= inicioDaJanela; // sem limite superior: tolera relógios levemente fora de sincronia
    const minutosOk =
      Number.isInteger(r.minutos) &&
      r.minutos >= LIMITES.MINUTOS_MIN &&
      r.minutos <= LIMITES.MINUTOS_MAX;
    if (dataOk && minutosOk) validos.push({ minutos: r.minutos, t });
  }

  if (validos.length === 0) {
    return { espera_min: null, n_relatos: 0, ultimo_relato_em: null };
  }

  const maisRecente = Math.max(...validos.map((v) => v.t));
  return {
    espera_min: mediana(validos.map((v) => v.minutos)),
    n_relatos: validos.length,
    ultimo_relato_em: new Date(maisRecente).toISOString(),
  };
}
