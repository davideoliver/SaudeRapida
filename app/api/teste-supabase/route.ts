import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("unidades")
    .select("id, nome, tipo, ativo")
    .limit(10);

  if (error) {
    return NextResponse.json({ ok: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: data.length, data });
}