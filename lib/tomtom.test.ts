import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const ORIGEM = { lat: -23.5, lng: -47.45 };
const A = { id: "a", lat: -23.48, lng: -47.44 };
const B = { id: "b", lat: -23.52, lng: -47.46 };

function celula(destinationIndex: number, segundos: number, metros: number) {
  return {
    originIndex: 0,
    destinationIndex,
    routeSummary: { lengthInMeters: metros, travelTimeInSeconds: segundos },
  };
}

// Cada chamada precisa de uma Response nova (o corpo só pode ser lido uma vez).
function respostaMatriz(celulas: object[]) {
  const corpo = {
    data: celulas,
    statistics: {
      totalCount: celulas.length,
      successes: celulas.length,
      failures: 0,
    },
  };
  return new Response(JSON.stringify(corpo), { status: 200 });
}

// O módulo guarda cache e disjuntor em memória: recarregar a cada teste.
async function carregar() {
  vi.resetModules();
  return import("./tomtom");
}

describe("buscarRotas (Matrix Routing v2)", () => {
  beforeEach(() => {
    vi.stubEnv("TOMTOM_API_KEY", "chave-de-teste");
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("converte segundos em minutos e metros em km", async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      respostaMatriz([celula(0, 750, 5300)]),
    );
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, [A]);
    expect(r.get("a")).toEqual({ viagem_min: 13, distancia_km: 5.3 });
  });

  it("sem chave devolve mapa vazio e não chama a API", async () => {
    vi.stubEnv("TOMTOM_API_KEY", "");
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, [A]);
    expect(r.size).toBe(0);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("calcula vários destinos com UMA única requisição", async () => {
    const destinos = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      lat: -23.5 + i * 0.01,
      lng: -47.45,
    }));
    vi.mocked(fetch).mockImplementation(async () =>
      respostaMatriz(destinos.map((_, i) => celula(i, 600, 4000))),
    );
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, destinos);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(r.size).toBe(5);
    const init = vi.mocked(fetch).mock.calls[0][1];
    const corpo = JSON.parse(String(init?.body));
    expect(corpo.destinations).toHaveLength(5);
  });

  it("calcula só as 12 unidades mais próximas, em uma requisição", async () => {
    const destinos = Array.from({ length: 30 }, (_, i) => ({
      id: `d${i}`,
      lat: -23.5 + i * 0.01,
      lng: -47.45,
    }));
    vi.mocked(fetch).mockImplementation(async (_url, init) => {
      const n = JSON.parse(String(init?.body)).destinations.length as number;
      return respostaMatriz(
        Array.from({ length: n }, (_, i) => celula(i, 600, 4000)),
      );
    });
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, destinos);

    expect(fetch).toHaveBeenCalledTimes(1);
    const corpo = JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body));
    expect(corpo.destinations).toHaveLength(12);
    expect(r.size).toBe(12);
    expect(r.has("d0")).toBe(true);   // a mais próxima
    expect(r.has("d29")).toBe(false); // a mais distante
  });

  it("ignora a célula sem rota e mantém as demais", async () => {
    // Formato do erro por célula não verificado: aqui só falta o routeSummary.
    vi.mocked(fetch).mockImplementation(async () =>
      respostaMatriz([
        celula(0, 600, 4000),
        { originIndex: 0, destinationIndex: 1 },
      ]),
    );
    const { buscarRotas } = await carregar();
    const r = await buscarRotas(ORIGEM, [A, B]);
    expect(r.has("a")).toBe(true);
    expect(r.has("b")).toBe(false);
  });

  it("reaproveita o cache na mesma grade de origem", async () => {
    vi.mocked(fetch).mockImplementation(async () =>
      respostaMatriz([celula(0, 750, 5300)]),
    );
    const { buscarRotas } = await carregar();
    await buscarRotas(ORIGEM, [A]);
    await buscarRotas({ lat: -23.5004, lng: -47.4503 }, [A]); // mesma grade
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("403 aciona o disjuntor: nenhuma nova chamada é feita", async () => {
    vi.mocked(fetch).mockImplementation(
      async () => new Response("{}", { status: 403 }),
    );
    const { buscarRotas } = await carregar();
    const primeira = await buscarRotas(ORIGEM, [A]);
    const segunda = await buscarRotas(ORIGEM, [B]);
    expect(primeira.size).toBe(0);
    expect(segunda.size).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("429 pausa por pouco tempo e depois volta a tentar", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(async () => new Response("{}", { status: 429 }))
      .mockImplementation(async () => respostaMatriz([celula(0, 600, 4000)]));
    const { buscarRotas } = await carregar();
    vi.useFakeTimers();

    const primeira = await buscarRotas(ORIGEM, [A]);
    expect(primeira.size).toBe(0);

    const durante = await buscarRotas(ORIGEM, [B]); // ainda dentro da pausa
    expect(durante.size).toBe(0);
    expect(fetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(31_000); // passou a pausa de 30 s
    const depois = await buscarRotas(ORIGEM, [B]);
    expect(depois.get("b")).toBeDefined();
  });
});
