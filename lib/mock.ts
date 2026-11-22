import type { RespostaUnidades, Unidade } from "@/types/unidade";

const BASE: Omit<Unidade, "total_min">[] = [
  {
    id: "1",
    nome: "[MOCK] UPA Norte",
    endereco: "Rua A, 100",
    lat: -23.48,
    lng: -47.44,
    espera_min: 45,
    n_relatos: 7,
    ultimo_relato_em: "2026-11-21T14:30:00Z",
    viagem_min: 12,
    distancia_km: 5.3,
    fonte_viagem: "transito",
  },
  {
    id: "2",
    nome: "[MOCK] UBS Centro",
    endereco: "Rua B, 200",
    lat: -23.5,
    lng: -47.46,
    espera_min: null,
    n_relatos: 0,
    ultimo_relato_em: null, // caso sem dados
    viagem_min: 6,
    distancia_km: 2.1,
    fonte_viagem: "transito",
  },
  {
    id: "3",
    nome: "[MOCK] UPA Sul",
    endereco: "Av. C, 300",
    lat: -23.54,
    lng: -47.43,
    espera_min: 20,
    n_relatos: 3,
    ultimo_relato_em: "2026-11-21T15:00:00Z",
    viagem_min: 25,
    distancia_km: 11.8,
    fonte_viagem: "estimado",
  }, // caso estimado
  // Complete até 6 ou 8 unidades, seguindo o mesmo padrão.
];

export function mockResposta(lat: number, lng: number): RespostaUnidades {
  const unidades = BASE.map((u) => ({
    ...u,
    total_min: u.viagem_min + (u.espera_min ?? 0),
  })).sort((a, b) => a.total_min - b.total_min);
  return { origem: { lat, lng }, unidades };
}
    