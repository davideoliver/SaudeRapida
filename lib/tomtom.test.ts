import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGEM = { lat: -23.5, lng: -47.45 };
const DESTINO_A = { id: "a", lat: -23.48, lng: -47.44 };
const DESTINO_B = { id: "b", lat: -23.52, lng: -47.46 };

function respostaOk() {
  const corpo = {
    routes: [{ summary: { travelTimeInSeconds: 750, lengthInMeters: 5300 } }],
  };
  return new Response(JSON.stringify(corpo), { status: 200 });
}

// O módulo guarda cache e disjuntor em memória: recarregar a cada teste.
async function carregar() {
  vi.resetModules();
  return import("./tomtom");
}

describe("buscarRotas", () => {
  beforeEach(() => {
    vi.stubEnv("TOMTOM_API_KEY", "chave-de-teste");
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("converte segundos em minutos e metros em km", async () => {
    vi.mocked(fetch).mockImplementation(async () => respostaOk());
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, [DESTINO_A]);
    expect(r.get("a")).toEqual({ viagem_min: 13, distancia_km: 5.3 });
  });

  it("sem chave devolve mapa vazio e não chama a API", async () => {
    vi.stubEnv("TOMTOM_API_KEY", "");
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, [DESTINO_A]);
    expect(r.size).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reaproveita o cache na mesma grade de origem", async () => {
    vi.mocked(fetch).mockImplementation(async () => respostaOk());
    const { buscarRotas } = await carregar();
    await buscarRotas(ORIGEM, [DESTINO_A]);
    await buscarRotas({ lat: -23.5004, lng: -47.4503 }, [DESTINO_A]); // mesma grade
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("403 aciona o disjuntor: nenhuma nova chamada é feita", async () => {
    vi.mocked(fetch).mockImplementation(
      async () => new Response("{}", { status: 403 }),
    );
    const { buscarRotas } = await carregar();
    const primeira = await buscarRotas(ORIGEM, [DESTINO_A]);
    const segunda = await buscarRotas(ORIGEM, [DESTINO_B]);
    expect(primeira.size).toBe(0);
    expect(segunda.size).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
