import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// O api-client lê a variável de ambiente ao ser importado,
// então cada teste reimporta o módulo depois de configurar o ambiente.
async function carregarClient() {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCK", "false");
  return import("@/lib/api-client");
}

describe("api-client (com API real simulada)", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("buscarUnidades devolve o JSON quando a resposta é 200", async () => {
    const corpo = { origem: { lat: 1, lng: 2 }, unidades: [] };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(corpo), { status: 200 }),
    );
    const { buscarUnidades } = await carregarClient();
    await expect(buscarUnidades(1, 2)).resolves.toEqual(corpo);
  });

  it("repassa o erro 422 no formato do contrato", async () => {
    const erro = {
      erro: "valor_invalido",
      mensagem: "Informe um tempo entre 1 e 720 minutos.",
    };
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify(erro), { status: 422 }),
    );
    const { enviarRelato } = await carregarClient();
    await expect(
      enviarRelato({ unidade_id: "u", minutos: 0, device_id: "d" }),
    ).rejects.toMatchObject({ erro: "valor_invalido", status: 422 });
  });

  it("vira erro_interno quando a resposta de erro não é JSON (ex.: página 404 em HTML)", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response("<html>404</html>", { status: 404 }),
    );
    const { buscarUnidades } = await carregarClient();
    await expect(buscarUnidades(1, 2)).rejects.toMatchObject({
      erro: "erro_interno",
      status: 404,
    });
  });
});
