import { describe, it, expect } from "vitest";
import { mockResposta } from "@/lib/mock";

describe("mockResposta", () => {
  const r = mockResposta(-23.5, -47.45);

  it("devolve a origem recebida", () => {
    expect(r.origem).toEqual({ lat: -23.5, lng: -47.45 });
  });

  it("calcula total_min = viagem_min + (espera_min ?? 0)", () => {
    for (const u of r.unidades) {
      expect(u.total_min).toBe(u.viagem_min + (u.espera_min ?? 0));
    }
  });

  it("ordena por total_min, do menor para o maior", () => {
    const totais = r.unidades.map((u) => u.total_min);
    expect(totais).toEqual([...totais].sort((a, b) => a - b));
  });

  it("cobre os casos que a tela precisa tratar", () => {
    expect(r.unidades.some((u) => u.espera_min === null)).toBe(true);
    expect(r.unidades.some((u) => u.fonte_viagem === "estimado")).toBe(true);
    expect(r.unidades.some((u) => u.fonte_viagem === "transito")).toBe(true);
  });
});