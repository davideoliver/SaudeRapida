import { LIMITES, type Coordenada } from "@/types/unidade";

export type Rota = { viagem_min: number; distancia_km: number };
export type Destino = { id: string; lat: number; lng: number };

const URL_MATRIZ = "https://api.tomtom.com/routing/matrix/2";
const TIMEOUT_MS = 6000;

// A documentação da TomTom cita limites diferentes (100, 200, 2500 células).
// 100 destinos por chamada é o menor valor que li, então é o que usamos.
const MAX_DESTINOS_POR_CHAMADA = 100;
// A Matrix é cobrada por célula e a cota gratuita mensal é pequena.
// Calculamos o trânsito apenas para as unidades mais próximas.
const MAX_COM_TRANSITO = 12;

const PAUSA_429_MS = 30_000; // excesso de requisições por segundo: pausa curta
const PAUSA_403_MS = 10 * 60_000; // chave inválida ou cota do dia esgotada: pausa longa
const MAX_ENTRADAS_CACHE = 500;

// Verifica se um valor desconhecido é um objeto indexável.
function ehRegistro(valor: unknown): valor is Record<string, unknown> {
  // Aceita apenas objetos não nulos, excluindo arrays.
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

// Estado em memória (vale por instância do servidor; ver "Limitações" no relatório).
const cache = new Map<string, { rota: Rota; em: number }>();
let pausadoAte = 0;

function pausar(ms: number) {
  pausadoAte = Math.max(pausadoAte, Date.now() + ms);
}

// Calcula a distância em linha reta apenas para selecionar os destinos próximos.
function distanciaRetaKm(a: Coordenada, b: { lat: number; lng: number }): number {
  // Converte graus para radianos antes de aplicar a fórmula de Haversine.
  const rad = Math.PI / 180;
  // Calcula a diferença de latitude em radianos.
  const dLat = (b.lat - a.lat) * rad;
  // Calcula a diferença de longitude em radianos.
  const dLng = (b.lng - a.lng) * rad;
  // Calcula o quadrado da metade da distância angular.
  const h =
    // Soma as componentes de latitude e longitude da distância angular.
    Math.sin(dLat / 2) ** 2 +
    // Ajusta a longitude pela latitude média dos pontos.
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  // Converte a distância angular em quilômetros usando o raio médio da Terra.
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}
function grade(n: number): string {
  const g = LIMITES.GRADE_ORIGEM_GRAUS;
  return (Math.round(n / g) * g).toFixed(3);
}

function chaveCache(origem: Coordenada, destinoId: string): string {
  return `${destinoId}:${grade(origem.lat)}:${grade(origem.lng)}`;
}

// 1 origem × N destinos numa única requisição.
// Devolve só as rotas que a TomTom conseguiu calcular (pode ser um Map vazio).
// Nunca registre a URL em log: ela contém a chave da API.
async function chamarMatriz(
  origem: Coordenada,
  destinos: Destino[],
  chave: string,
): Promise<Map<string, Rota>> {
  const resultado = new Map<string, Rota>();

  const corpo = {
    origins: [{ point: { latitude: origem.lat, longitude: origem.lng } }],
    destinations: destinos.map((d) => ({
      point: { latitude: d.lat, longitude: d.lng },
    })),
    options: { departAt: "now", traffic: "live", travelMode: "car" },
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${URL_MATRIZ}?key=${encodeURIComponent(chave)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      cache: "no-store",
      signal: ctrl.signal,
    });

    if (res.status === 429) {
      pausar(PAUSA_429_MS);
      console.warn("TomTom 429 (muitas requisições): pausa curta de 30 s");
      return resultado;
    }
    if (res.status === 403) {
      pausar(PAUSA_403_MS);
      console.warn(
        "TomTom 403 (chave inválida ou cota esgotada): pausa de 10 min",
      );
      return resultado;
    }
    if (!res.ok) return resultado;

    const json: unknown = await res.json();
    const celulas: unknown[] =
      ehRegistro(json) && Array.isArray(json.data) ? json.data : [];

    for (const celula of celulas) {
      if (!ehRegistro(celula)) continue;
      const indiceDestino = celula.destinationIndex;
      if (typeof indiceDestino !== "number") continue;
      const destino = destinos[indiceDestino];
      const s = celula.routeSummary;
      // Célula que falhou vem sem routeSummary: fica de fora e cai no fallback.
      if (
        !destino ||
        !ehRegistro(s) ||
        typeof s.travelTimeInSeconds !== "number" ||
        typeof s.lengthInMeters !== "number"
      ) {
        continue;
      }
      resultado.set(destino.id, {
        viagem_min: Math.max(1, Math.round(s.travelTimeInSeconds / 60)),
        distancia_km: Math.round(s.lengthInMeters / 100) / 10,
      });
    }
    return resultado;
  } catch {
    return resultado; // timeout, sem rede, JSON quebrado...
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Devolve um Map id → Rota SÓ para os destinos que conseguiu calcular.
 * Quem chama usa o fallback para todos os que ficarem de fora.
 */
export async function buscarRotas(
  origem: Coordenada,
  destinos: Destino[],
): Promise<Map<string, Rota>> {
  const resultado = new Map<string, Rota>();
  const chave = process.env.TOMTOM_API_KEY;
  if (!chave) return resultado;

  const validadeMs = LIMITES.CACHE_ROTA_MIN * 60_000;
  const pendentes: Destino[] = [];
  const maisProximos = [...destinos]
    .sort((a, b) => distanciaRetaKm(origem, a) - distanciaRetaKm(origem, b))
    .slice(0, MAX_COM_TRANSITO);
  for (const d of maisProximos) {
    const hit = cache.get(chaveCache(origem, d.id));
    if (hit && Date.now() - hit.em < validadeMs) resultado.set(d.id, hit.rota);
    else pendentes.push(d);
  }

  for (let i = 0; i < pendentes.length; i += MAX_DESTINOS_POR_CHAMADA) {
    if (Date.now() < pausadoAte) break;
    const lote = pendentes.slice(i, i + MAX_DESTINOS_POR_CHAMADA);
    const rotas = await chamarMatriz(origem, lote, chave);
    for (const [id, rota] of rotas) {
      resultado.set(id, rota);
      if (cache.size >= MAX_ENTRADAS_CACHE) cache.clear();
      cache.set(chaveCache(origem, id), { rota, em: Date.now() });
    }
  }
  return resultado;
}
