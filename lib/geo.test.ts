import { describe, expect, it } from "vitest";
import { estimarViagem, haversineKm, parseCoordenada } from "./geo";

describe("haversineKm", () => {
  it("mesmo ponto → 0", () => {
    const p = { lat: -23.5, lng: -47.45 };
    expect(haversineKm(p, p)).toBe(0);
  });

  it("1 grau de latitude ≈ 111,19 km", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.19, 1);
  });

  it("é simétrica (ida = volta)", () => {
    const a = { lat: -23.5, lng: -47.45 };
    const b = { lat: -23.48, lng: -47.44 };
    expect(haversineKm(a, b)).toBeCloseTo(haversineKm(b, a), 10);
  });
});

describe("estimarViagem", () => {
  const origem = { lat: -23.5, lng: -47.45 };

  it("mesmo ponto → 0 km e no mínimo 1 minuto", () => {
    expect(estimarViagem(origem, origem)).toEqual({ viagem_min: 1, distancia_km: 0 });
  });

  it("~5 km em linha reta vira ~7 km de rua e ~17 min", () => {
    const destino = { lat: -23.545, lng: -47.45 };
    const v = estimarViagem(origem, destino);
    expect(v.distancia_km).toBeCloseTo(7.0, 0);
    expect(v.viagem_min).toBeGreaterThanOrEqual(15);
    expect(v.viagem_min).toBeLessThanOrEqual(19);
  });

  it("mais longe → mais minutos", () => {
    const perto = estimarViagem(origem, { lat: -23.51, lng: -47.45 });
    const longe = estimarViagem(origem, { lat: -23.6, lng: -47.45 });
    expect(longe.viagem_min).toBeGreaterThan(perto.viagem_min);
  });

  it("devolve inteiro de minutos e uma casa decimal de km", () => {
    const v = estimarViagem(origem, { lat: -23.52, lng: -47.47 });
    expect(Number.isInteger(v.viagem_min)).toBe(true);
    expect(Math.round(v.distancia_km * 10)).toBeCloseTo(v.distancia_km * 10, 6);
  });
});

describe("parseCoordenada", () => {
  it("aceita números válidos (inclusive negativos e decimais)", () => {
    expect(parseCoordenada("-23.50", "-47.45")).toEqual({ lat: -23.5, lng: -47.45 });
  });

  it("rejeita ausente (null)", () => {
    expect(parseCoordenada(null, "-47.45")).toBeNull();
    expect(parseCoordenada("-23.5", null)).toBeNull();
  });

  it("rejeita vazio (Number('') seria 0, e isso seria um bug silencioso)", () => {
    expect(parseCoordenada("", "-47.45")).toBeNull();
    expect(parseCoordenada("  ", "-47.45")).toBeNull();
  });

  it("rejeita texto e vírgula decimal", () => {
    expect(parseCoordenada("abc", "-47.45")).toBeNull();
    expect(parseCoordenada("-23,5", "-47.45")).toBeNull();
  });

  it("rejeita fora do intervalo", () => {
    expect(parseCoordenada("91", "0")).toBeNull();
    expect(parseCoordenada("0", "181")).toBeNull();
  });

  it("rejeita Infinity e NaN", () => {
    expect(parseCoordenada("Infinity", "0")).toBeNull();
    expect(parseCoordenada("NaN", "0")).toBeNull();
  });
});
