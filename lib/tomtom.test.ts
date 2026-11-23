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

// O módulo guarda cache e pausa em memória: recarregar a cada teste.
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
    vi.useRealTimers();
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

  it("403 aciona a pausa longa: nenhuma nova chamada é feita", async () => {
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

  it("429 pausa por pouco tempo e depois volta a tentar", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(async () => new Response("{}", { status: 429 }))
      .mockImplementation(async () => respostaOk());
    const { buscarRotas } = await carregar();
    vi.useFakeTimers();

    const primeira = await buscarRotas(ORIGEM, [DESTINO_A]);
    expect(primeira.size).toBe(0);

    const durante = await buscarRotas(ORIGEM, [DESTINO_B]); // ainda dentro da pausa
    expect(durante.size).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(31_000); // passou a pausa de 30 s
    const depois = await buscarRotas(ORIGEM, [DESTINO_B]);
    expect(depois.get("b")).toBeDefined();
  });

  it("só calcula rota para as 8 unidades mais próximas", async () => {
    vi.mocked(fetch).mockImplementation(async () => respostaOk());
    const { buscarRotas } = await carregar();
    vi.useFakeTimers();

    // d0 é a mais próxima; a distância cresce com o índice
    const destinos = Array.from({ length: 12 }, (_, i) => ({
      id: `d${i}`,
      lat: -23.5 + i * 0.01,
      lng: -47.45,
    }));

    const promessa = buscarRotas(ORIGEM, destinos);
    await vi.runAllTimersAsync();
    const r = await promessa;

    expect(fetch).toHaveBeenCalledTimes(8);
    expect(r.size).toBe(8);
    expect(r.has("d0")).toBe(true);
    expect(r.has("d11")).toBe(false);
  });
});
