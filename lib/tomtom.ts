import { LIMITES, type Coordenada } from "@/types/unidade";

export type Rota = { viagem_min: number; distancia_km: number };
export type Destino = { id: string; lat: number; lng: number };

const BASE = "https://api.tomtom.com/routing/1/calculateRoute";
const TIMEOUT_MS = 4000;

// Proteção da cota gratuita da TomTom
const MAX_COM_TRANSITO = 8;        // só as N unidades mais próximas ganham rota com trânsito
const TAMANHO_LOTE = 2;            // chamadas simultâneas
const PAUSA_ENTRE_LOTES_MS = 500;  // mantém abaixo do limite de requisições por segundo
const PAUSA_429_MS = 30_000;       // excesso de velocidade: pausa curta
const PAUSA_403_MS = 10 * 60_000;  // chave inválida ou cota do dia esgotada: pausa longa
const MAX_ENTRADAS_CACHE = 500;

// Estado em memória (vale por instância do servidor; ver "Limitações" no relatório).
const cache = new Map<string, { rota: Rota; em: number }>();
let pausadoAte = 0;

function pausar(ms: number) {
  pausadoAte = Math.max(pausadoAte, Date.now() + ms);
}

function dormir(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

// Distância em linha reta (haversine), só para escolher as unidades mais próximas.
function distanciaRetaKm(a: Coordenada, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function grade(n: number): string {
  const g = LIMITES.GRADE_ORIGEM_GRAUS;
  return (Math.round(n / g) * g).toFixed(3);
}

function chaveCache(origem: Coordenada, destinoId: string): string {
  return `${destinoId}:${grade(origem.lat)}:${grade(origem.lng)}`;
}

// Devolve null em QUALQUER falha, para quem chamou cair no fallback.
// Nunca registre a URL em log: ela contém a chave da API.
async function chamarTomTom(
  origem: Coordenada,
  destino: Destino,
  chave: string,
): Promise<Rota | null> {
  const url = new URL(
    `${BASE}/${origem.lat},${origem.lng}:${destino.lat},${destino.lng}/json`,
  );
  url.searchParams.set("key", chave);
  url.searchParams.set("traffic", "true");
  url.searchParams.set("travelMode", "car");

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });

    if (res.status === 429) {
      pausar(PAUSA_429_MS);
      console.warn("TomTom 429 (muitas requisições): pausa curta de 30 s");
      return null;
    }
    if (res.status === 403) {
      pausar(PAUSA_403_MS);
      console.warn("TomTom 403 (chave inválida ou cota esgotada): pausa de 10 min");
      return null;
    }
    if (!res.ok) return null;

    const corpo = await res.json();
    const s = corpo?.routes?.[0]?.summary;
    if (
      !s ||
      typeof s.travelTimeInSeconds !== "number" ||
      typeof s.lengthInMeters !== "number"
    ) {
      return null;
    }
    return {
      viagem_min: Math.max(1, Math.round(s.travelTimeInSeconds / 60)),
      distancia_km: Math.round(s.lengthInMeters / 100) / 10,
    };
  } catch {
    return null; // timeout, sem rede, JSON quebrado...
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Devolve um Map id → Rota SÓ para os destinos que conseguiu calcular.
 * Calcula no máximo MAX_COM_TRANSITO rotas (as unidades mais próximas em linha reta).
 * Quem chama usa o fallback para todas as que ficarem de fora.
 */
export async function buscarRotas(
  origem: Coordenada,
  destinos: Destino[],
): Promise<Map<string, Rota>> {
  const resultado = new Map<string, Rota>();
  const chave = process.env.TOMTOM_API_KEY;
  if (!chave) return resultado;

  const maisProximos = [...destinos]
    .sort((a, b) => distanciaRetaKm(origem, a) - distanciaRetaKm(origem, b))
    .slice(0, MAX_COM_TRANSITO);

  const validadeMs = LIMITES.CACHE_ROTA_MIN * 60_000;
  const pendentes: Destino[] = [];
  for (const d of maisProximos) {
    const hit = cache.get(chaveCache(origem, d.id));
    if (hit && Date.now() - hit.em < validadeMs) resultado.set(d.id, hit.rota);
    else pendentes.push(d);
  }

  for (let i = 0; i < pendentes.length; i += TAMANHO_LOTE) {
    if (Date.now() < pausadoAte) break;
    if (i > 0) await dormir(PAUSA_ENTRE_LOTES_MS);

    const lote = pendentes.slice(i, i + TAMANHO_LOTE);
    const respostas = await Promise.all(
      lote.map((d) => chamarTomTom(origem, d, chave)),
    );
    lote.forEach((d, j) => {
      const rota = respostas[j];
      if (!rota) return;
      resultado.set(d.id, rota);
      if (cache.size >= MAX_ENTRADAS_CACHE) cache.clear();
      cache.set(chaveCache(origem, d.id), { rota, em: Date.now() });
    });
  }
  return resultado;
}