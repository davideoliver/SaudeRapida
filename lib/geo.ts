import type { Coordenada } from "@/types/unidade";

/**
 * Funções geográficas puras (sem rede, sem banco).
 * Servem de FALLBACK quando a API de rotas (TomTom) falha ou a cota acaba:
 * não sabem do trânsito, então o resultado é marcado como "estimado".
 */

const RAIO_DA_TERRA_KM = 6371;

/** Ruas não são linha reta: a rota real costuma ser ~30 a 50% maior. */
export const FATOR_DE_DESVIO = 1.4;

/** Velocidade média urbana com trânsito moderado. Ajustável, e deve ser citada no relatório. */
export const VELOCIDADE_MEDIA_KMH = 25;

const paraRadianos = (graus: number) => (graus * Math.PI) / 180;

/** Distância em linha reta (km) entre dois pontos da superfície da Terra (fórmula de Haversine). */
export function haversineKm(a: Coordenada, b: Coordenada): number {
  const dLat = paraRadianos(b.lat - a.lat);
  const dLng = paraRadianos(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(paraRadianos(a.lat)) * Math.cos(paraRadianos(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * RAIO_DA_TERRA_KM * Math.asin(Math.sqrt(h));
}

export type ViagemEstimada = {
  viagem_min: number; // inteiro, pelo menos 1
  distancia_km: number; // uma casa decimal
};

/** Estima a viagem: distância em linha reta × fator de desvio, dividida pela velocidade média. */
export function estimarViagem(origem: Coordenada, destino: Coordenada): ViagemEstimada {
  const km = haversineKm(origem, destino) * FATOR_DE_DESVIO;
  return {
    viagem_min: Math.max(1, Math.round((km / VELOCIDADE_MEDIA_KMH) * 60)),
    distancia_km: Math.round(km * 10) / 10,
  };
}

/**
 * Converte os parâmetros de URL (sempre texto, ou null se ausentes) em coordenada válida.
 * Devolve null se faltar, não for número ou estiver fora do intervalo.
 * Cuidado: Number("") e Number(null) valem 0, então esses casos precisam ser barrados antes.
 */
export function parseCoordenada(
  latTexto: string | null,
  lngTexto: string | null,
): Coordenada | null {
  if (latTexto === null || lngTexto === null) return null;
  if (latTexto.trim() === "" || lngTexto.trim() === "") return null;

  const lat = Number(latTexto);
  const lng = Number(lngTexto);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  return { lat, lng };
}
