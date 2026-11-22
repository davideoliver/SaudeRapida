import { NextResponse } from "next/server";
import { calcularEspera, type RelatoParaCalculo } from "@/lib/estimativa";
import { estimarViagem, parseCoordenada } from "@/lib/geo";
import { supabase } from "@/lib/supabase";
import { LIMITES } from "@/types/unidade";
import type { ErroApi, RespostaUnidades, Unidade } from "@/types/unidade";

type UnidadeDb = {
  id: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
};
type RelatoDb = { unidade_id: string; minutos: number; criado_em: string };

function responderErro(status: number, corpo: ErroApi) {
  return NextResponse.json(corpo, { status });
}

export async function GET(req: Request) {
  // 1) Validar a entrada (contrato: 400 parametros_invalidos)
  const { searchParams } = new URL(req.url);
  const origem = parseCoordenada(
    searchParams.get("lat"),
    searchParams.get("lng"),
  );
  if (!origem) {
    return responderErro(400, {
      erro: "parametros_invalidos",
      mensagem:
        "Informe lat (-90 a 90) e lng (-180 a 180) como números com ponto decimal.",
    });
  }

  try {
    // 2) Buscar no banco: unidades ativas e relatos da janela de tempo (em paralelo)
    const agora = new Date();
    const desde = new Date(
      agora.getTime() - LIMITES.JANELA_RELATOS_HORAS * 3_600_000,
    ).toISOString();

    const [resUnidades, resRelatos] = await Promise.all([
      supabase
        .from("unidades")
        .select("id, nome, endereco, lat, lng")
        .eq("ativo", true),
      // Obs.: o Supabase devolve no máximo ~1000 linhas por consulta. Para a demo basta;
      // em escala, a mediana passaria a ser calculada no banco (registrar em "Trabalhos futuros").
      supabase
        .from("relatos")
        .select("unidade_id, minutos, criado_em")
        .gte("criado_em", desde),
    ]);

    if (resUnidades.error || resRelatos.error) {
      console.error("Erro Supabase:", resUnidades.error ?? resRelatos.error);
      return responderErro(500, {
        erro: "erro_interno",
        mensagem: "Não foi possível carregar os dados agora.",
      });
    }

    const unidadesDb = (resUnidades.data ?? []) as UnidadeDb[];
    const relatosDb = (resRelatos.data ?? []) as RelatoDb[];

    // 3) Agrupar os relatos por unidade
    const relatosPorUnidade = new Map<string, RelatoParaCalculo[]>();
    for (const r of relatosDb) {
      const lista = relatosPorUnidade.get(r.unidade_id) ?? [];
      lista.push({ minutos: r.minutos, criado_em: r.criado_em });
      relatosPorUnidade.set(r.unidade_id, lista);
    }

    // 4) Montar cada unidade no formato do contrato
    const unidades: Unidade[] = unidadesDb.map((u) => {
      const espera = calcularEspera(relatosPorUnidade.get(u.id) ?? [], agora);
      // v0: viagem ESTIMADA. No commit seguinte, tomtom.ts passa a preencher "transito" e este vira o fallback.
      const viagem = estimarViagem(origem, { lat: u.lat, lng: u.lng });

      // O contrato diz "tempo em minutos inteiros": a mediana (ex.: 37.5) é arredondada só aqui.
      const esperaInteira =
        espera.espera_min === null ? null : Math.round(espera.espera_min);

      return {
        id: u.id,
        nome: u.nome,
        endereco: u.endereco,
        lat: u.lat,
        lng: u.lng,
        espera_min: esperaInteira,
        n_relatos: espera.n_relatos,
        ultimo_relato_em: espera.ultimo_relato_em,
        viagem_min: viagem.viagem_min,
        distancia_km: viagem.distancia_km,
        total_min: viagem.viagem_min + (esperaInteira ?? 0),
        fonte_viagem: "estimado",
      };
    });

    // 5) Ordenar por total_min (menor primeiro); empate → a mais perto
    unidades.sort(
      (a, b) => a.total_min - b.total_min || a.distancia_km - b.distancia_km,
    );

    const corpo: RespostaUnidades = { origem, unidades };
    return NextResponse.json(corpo);
  } catch (e) {
    console.error("Erro inesperado em GET /api/unidades:", e);
    return responderErro(500, {
      erro: "erro_interno",
      mensagem: "Algo deu errado. Tente de novo.",
    });
  }
}
