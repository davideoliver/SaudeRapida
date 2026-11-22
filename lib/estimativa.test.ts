import { describe, expect, it } from "vitest";
import { calcularEspera, mediana } from "./estimativa";

// Relógio fixo: os testes não dependem da hora em que são executados.
const AGORA = new Date("2026-11-21T18:00:00Z");

/** Cria um relato com `minutos` de espera, feito há `minAtras` minutos. */
const rel = (minutos: number, minAtras: number) => ({
  minutos,
  criado_em: new Date(AGORA.getTime() - minAtras * 60_000).toISOString(),
});

describe("mediana", () => {
  it("um único valor", () => {
    expect(mediana([5])).toBe(5);
  });

  it("quantidade ímpar: valor do meio", () => {
    expect(mediana([30, 10, 20])).toBe(20);
  });

  it("quantidade par: média dos dois do meio", () => {
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
  });

  it("ordena NUMERICAMENTE (sort() padrão compararia como texto)", () => {
    // Texto: ["10","100","9"] → meio = 100 (errado). Número: [9,10,100] → meio = 10.
    expect(mediana([9, 10, 100])).toBe(10);
  });

  it("lista vazia é erro de programação", () => {
    expect(() => mediana([])).toThrow();
  });
});

describe("calcularEspera: cenários do seed_relatos_teste.sql", () => {
  it("Unidade 1: troll de 600 não distorce e o relato de 5 h atrás é ignorado → 37.5", () => {
    const r = calcularEspera(
      [rel(30, 20), rel(35, 45), rel(40, 60), rel(600, 90), rel(15, 300)],
      AGORA,
    );
    expect(r.espera_min).toBe(37.5);
    expect(r.n_relatos).toBe(4);
    expect(r.ultimo_relato_em).toBe(rel(30, 20).criado_em);
  });

  it("Unidade 2: quantidade ímpar → 20", () => {
    const r = calcularEspera([rel(10, 10), rel(20, 25), rel(30, 50)], AGORA);
    expect(r.espera_min).toBe(20);
    expect(r.n_relatos).toBe(3);
  });

  it("Unidade 3: um relato → o próprio valor", () => {
    const r = calcularEspera([rel(75, 15)], AGORA);
    expect(r.espera_min).toBe(75);
    expect(r.n_relatos).toBe(1);
  });

  it("Unidades 4 a 8: sem relatos → null (nunca 0)", () => {
    expect(calcularEspera([], AGORA)).toEqual({
      espera_min: null,
      n_relatos: 0,
      ultimo_relato_em: null,
    });
  });
});

describe("calcularEspera: janela de tempo", () => {
  it("inclui exatamente 3 h atrás e exclui 3 h e 1 min atrás", () => {
    const r = calcularEspera([rel(30, 180), rel(31, 181)], AGORA);
    expect(r.espera_min).toBe(30);
    expect(r.n_relatos).toBe(1);
  });

  it("só relatos antigos → null", () => {
    expect(calcularEspera([rel(30, 600)], AGORA).espera_min).toBeNull();
  });
});

describe("calcularEspera: validação dos valores", () => {
  it("descarta 0, negativo, acima de 720, absurdo e não inteiro", () => {
    const r = calcularEspera(
      [rel(0, 5), rel(-5, 5), rel(721, 5), rel(99999, 5), rel(12.5, 5)],
      AGORA,
    );
    expect(r.espera_min).toBeNull();
    expect(r.n_relatos).toBe(0);
  });

  it("aceita os limites 1 e 720", () => {
    const r = calcularEspera([rel(1, 5), rel(720, 5)], AGORA);
    expect(r.n_relatos).toBe(2);
    expect(r.espera_min).toBe(360.5);
  });

  it("mistura de válidos e inválidos: só os válidos contam", () => {
    const r = calcularEspera([rel(0, 5), rel(40, 5)], AGORA);
    expect(r.espera_min).toBe(40);
    expect(r.n_relatos).toBe(1);
  });

  it("ignora relato com data inválida", () => {
    const r = calcularEspera([{ minutos: 30, criado_em: "lixo" }, rel(50, 10)], AGORA);
    expect(r.espera_min).toBe(50);
    expect(r.n_relatos).toBe(1);
  });
});

describe("calcularEspera: efeitos colaterais", () => {
  it("não altera o array recebido", () => {
    const entrada = [rel(40, 10), rel(30, 20), rel(10, 30)];
    const antes = JSON.stringify(entrada);
    calcularEspera(entrada, AGORA);
    expect(JSON.stringify(entrada)).toBe(antes);
  });
});
