import type {
  CodigoErro, NovoRelato, RespostaRelato, RespostaUnidades,
} from "@/types/unidade";
import { mockResposta } from "./mock";

// Valor fixado no build: depois de mudar o .env.local, reinicie o npm run dev.
const USAR_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export type ErroDaApi = { erro: CodigoErro; mensagem: string; status: number };

async function lerErro(res: Response): Promise<ErroDaApi> {
  const corpo = await res.json().catch(() => null);
  return {
    erro: corpo?.erro ?? "erro_interno",
    mensagem: corpo?.mensagem ?? "Algo deu errado. Tente de novo.",
    status: res.status,
  };
}

export async function buscarUnidades(lat: number, lng: number): Promise<RespostaUnidades> {
  if (USAR_MOCK) return mockResposta(lat, lng);
  const res = await fetch(`/api/unidades?lat=${lat}&lng=${lng}`);
  if (!res.ok) throw await lerErro(res);
  return res.json();
}

export async function enviarRelato(relato: NovoRelato): Promise<RespostaRelato> {
  if (USAR_MOCK) return { ok: true, relato_id: "mock" };
  const res = await fetch("/api/relatos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(relato),
  });
  if (!res.ok) throw await lerErro(res);
  return res.json();
}