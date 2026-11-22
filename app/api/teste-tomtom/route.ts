import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from"); // "lat,lng"
  const to = searchParams.get("to");     // "lat,lng"
  const departAt = searchParams.get("departAt"); // optional, e.g. 2026-11-23T18:00:00

  const key = process.env.TOMTOM_API_KEY;
  if (!key) {
    return NextResponse.json({ ok: false, erro: "Missing TOMTOM_API_KEY" }, { status: 500 });
  }
  if (!from || !to) {
    return NextResponse.json({ ok: false, erro: "Use ?from=lat,lng&to=lat,lng" }, { status: 400 });
  }

  const normalizeCoordinate = (value: string) => {
    const match = /^(-?\d{1,2}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)$/.exec(value);
    if (!match) return null;

    const latitude = Number(match[1]);
    const longitude = Number(match[2]);
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

    return `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  };

  const normalizedFrom = normalizeCoordinate(from);
  const normalizedTo = normalizeCoordinate(to);
  if (!normalizedFrom || !normalizedTo) {
    return NextResponse.json({ ok: false, erro: "Invalid coordinates" }, { status: 400 });
  }

  const url = new URL(`https://api.tomtom.com/routing/1/calculateRoute/${normalizedFrom}:${normalizedTo}/json`);
  url.searchParams.set("key", key);
  url.searchParams.set("traffic", "true");
  url.searchParams.set("travelMode", "car");
  url.searchParams.set("computeTravelTimeFor", "all");
  if (departAt) url.searchParams.set("departAt", departAt);

  const res = await fetch(url, { cache: "no-store" });
  const body = await res.json().catch(() => null);

  if (!res.ok) {
    return NextResponse.json({ ok: false, status: res.status, body }, { status: 502 });
  }

  const s = body?.routes?.[0]?.summary;
  return NextResponse.json({
    ok: true,
    distancia_km: Math.round(s.lengthInMeters / 100) / 10,
    viagem_com_transito_min: Math.round(s.travelTimeInSeconds / 60),
    viagem_sem_transito_min:
      s.noTrafficTravelTimeInSeconds != null
        ? Math.round(s.noTrafficTravelTimeInSeconds / 60)
        : null,
    atraso_transito_min: Math.round((s.trafficDelayInSeconds ?? 0) / 60),
    resumo_bruto: s,
  });
}