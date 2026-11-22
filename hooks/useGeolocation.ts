"use client";
import { useEffect, useState } from "react";
import type { Coordenada } from "@/types/unidade";

// Centro padrão (Sorocaba/SP). Troque se a cidade do grupo for outra.
export const CENTRO_PADRAO: Coordenada = { lat: -23.5015, lng: -47.4526 };

export type EstadoGps = "carregando" | "ok" | "negado" | "indisponivel";

export function useGeolocation() {
  const [pos, setPos] = useState<Coordenada>(CENTRO_PADRAO);
  const [estado, setEstado] = useState<EstadoGps>("carregando");

  useEffect(() => {
    const geo = navigator.geolocation;
    if (!geo) {
      const t = setTimeout(() => setEstado("indisponivel"), 0);
      return () => clearTimeout(t);
    }
    geo.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
        setEstado("ok");
      },
      (err) =>
        setEstado(
          err.code === err.PERMISSION_DENIED ? "negado" : "indisponivel",
        ),
      { timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  return { pos, estado };
}
