import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  LIMITES,
  type CodigoErro,
  type ErroApi,
  type RespostaRelato,
} from "@/types/unidade";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function erro(codigo: CodigoErro, mensagem: string, status: number) {
  const corpo: ErroApi = { erro: codigo, mensagem };
  return NextResponse.json(corpo, { status });
}

export async function POST(req: Request) {
  // 1) Ler o corpo (pode vir quebrado)
  let corpo: Record<string, unknown>;
  try {
    corpo = await req.json();
  } catch {
    return erro("valor_invalido", "Corpo da requisição inválido.", 422);
  }
  const { unidade_id, minutos, device_id } = corpo ?? {};

  // 2) Validar formato (422)
  if (
    typeof unidade_id !== "string" ||
    !UUID.test(unidade_id) ||
    typeof device_id !== "string" ||
    !UUID.test(device_id)
  ) {
    return erro("valor_invalido", "Identificadores inválidos.", 422);
  }
  if (
    typeof minutos !== "number" ||
    !Number.isInteger(minutos) ||
    minutos < LIMITES.MINUTOS_MIN ||
    minutos > LIMITES.MINUTOS_MAX
  ) {
    return erro(
      "valor_invalido",
      `Informe um tempo entre ${LIMITES.MINUTOS_MIN} e ${LIMITES.MINUTOS_MAX} minutos.`,
      422,
    );
  }

  // 3) A unidade existe e está ativa? (404)
  const { data: unidade, error: e1 } = await supabase
    .from("unidades")
    .select("id")
    .eq("id", unidade_id)
    .eq("ativo", true)
    .maybeSingle();
  if (e1) return erro("erro_interno", "Algo deu errado. Tente de novo.", 500);
  if (!unidade)
    return erro("unidade_inexistente", "Unidade não encontrada.", 404);

  // 4) Este aparelho já relatou esta unidade há pouco? (429)
  const desde = new Date(
    Date.now() - LIMITES.INTERVALO_ENTRE_RELATOS_MIN * 60_000,
  ).toISOString();
  const { count, error: e2 } = await supabase
    .from("relatos")
    .select("id", { count: "exact", head: true })
    .eq("device_id", device_id)
    .eq("unidade_id", unidade_id)
    .gte("criado_em", desde);
  if (e2) return erro("erro_interno", "Algo deu errado. Tente de novo.", 500);
  if ((count ?? 0) > 0) {
    return erro(
      "relato_recente",
      "Você já informou o tempo desta unidade há pouco. Tente novamente mais tarde.",
      429,
    );
  }

  // 5) Salvar (201)
  const { data, error: e3 } = await supabase
    .from("relatos")
    .insert({ unidade_id, minutos, device_id })
    .select("id")
    .single();
  if (e3 || !data)
    return erro("erro_interno", "Algo deu errado. Tente de novo.", 500);

  const ok: RespostaRelato = { ok: true, relato_id: data.id };
  return NextResponse.json(ok, { status: 201 });
}
