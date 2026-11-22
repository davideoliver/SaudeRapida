"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { buscarUnidades } from "@/lib/api-client";
import RelatoForm from "@/components/RelatoForm";
import type { RespostaUnidades, Unidade } from "@/types/unidade";
import UnidadeCard from "@/components/UnidadeCard";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-950" />,
});

function LoadingScreen() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-screen absolute inset-0 z-30 flex flex-col items-center justify-center px-6 text-white"
    >
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] border border-red-400/20 bg-red-500/10 text-red-500/35">
        <svg
          aria-hidden="true"
          viewBox="0 0 48 48"
          className="h-14 w-14"
          fill="none"
        >
          <path
            d="M20 6h8v14h14v8H28v14h-8V28H6v-8h14V6Z"
            fill="currentColor"
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold tracking-wide">
        Carregando Unidades...
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Estamos preparando o mapa para você
      </p>
      <div className="loading-track mt-8" aria-hidden="true">
        <div className="loading-progress" />
        <svg className="loading-ambulance" viewBox="0 0 64 36" fill="none">
          <path
            d="M4 8a3 3 0 0 1 3-3h30a3 3 0 0 1 3 3v21H4V8Z"
            fill="#f8fafc"
          />
          <path d="M40 14h10l9 9v6H40V14Z" fill="#fee2e2" />
          <path d="M43 17h6l6 6H43v-6Z" fill="#94a3b8" />
          <path d="M18 11h6v6h6v6h-6v6h-6v-6h-6v-6h6v-6Z" fill="#dc2626" />
          <circle cx="15" cy="30" r="5" fill="#1e293b" />
          <circle cx="15" cy="30" r="2" fill="#cbd5e1" />
          <circle cx="49" cy="30" r="5" fill="#1e293b" />
          <circle cx="49" cy="30" r="2" fill="#cbd5e1" />
        </svg>
      </div>
      <span className="sr-only">Carregando unidades de saúde</span>
    </div>
  );
}

export default function Home() {
  const { pos, estado } = useGeolocation();
  const [relatando, setRelatando] = useState<Unidade | null>(null);
  const [dados, setDados] = useState<RespostaUnidades | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [tempoMinimoConcluido, setTempoMinimoConcluido] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setTempoMinimoConcluido(true), 2200);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (estado === "carregando") return;
    let cancelado = false;
    buscarUnidades(pos.lat, pos.lng)
      .then((d) => {
        if (!cancelado) {
          setDados(d);
          setErro(null);
        }
      })
      .catch((e) => {
        if (!cancelado) setErro(e?.mensagem ?? "Não foi possível carregar.");
      });
    return () => {
      cancelado = true;
    };
  }, [pos, estado, tentativa]);

  const carregando = (!dados && !erro) || !tempoMinimoConcluido;

  return (
    <main className="relative isolate h-dvh min-h-[560px] overflow-hidden bg-slate-200">
      <div className="absolute inset-0 z-0">
        <MapView
          origem={dados?.origem ?? pos}
          unidades={dados?.unidades ?? []}
          onSelecionar={setSelecionada}
        />
      </div>

      <header className="pointer-events-none absolute inset-x-0 top-0 z-10 pl-16 pr-4 pt-4 sm:pl-20 sm:pr-6 sm:pt-6">
        <div className="flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/85 px-4 py-3 text-white shadow-lg shadow-slate-950/20 backdrop-blur-xl">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-red-600 shadow-md shadow-slate-950/20"
          >
            <svg viewBox="0 0 32 32" className="h-7 w-7" fill="none">
              <path
                d="M13 4h6v9h9v6h-9v9h-6v-9H4v-6h9V4Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Saúde <span className="text-red-600">Rápida</span>
            </h1>
            <p className="text-xs font-medium tracking-wide text-slate-300">
              Cuidado perto de você
            </p>
          </div>
        </div>
      </header>

      <section
        aria-label="Unidades de saúde próximas"
        className="absolute inset-x-3 bottom-3 top-32 z-10 flex flex-col gap-3 sm:inset-x-auto sm:right-6 sm:top-28 sm:bottom-6 sm:w-[28rem] sm:max-w-[calc(100vw_-_3rem)]"
      >
        {(estado === "negado" || estado === "indisponivel") && (
          <p className="shrink-0 rounded-2xl border border-amber-200/20 bg-slate-950/85 p-3 text-sm text-amber-200 shadow-lg backdrop-blur-xl">
            Não conseguimos sua localização. Mostrando o centro da cidade.
          </p>
        )}

        <div className="hospital-list-scroll min-h-0 flex-1 overflow-y-auto rounded-3xl border border-white/10 bg-slate-950/75 p-3 shadow-2xl shadow-slate-950/25 backdrop-blur-xl sm:p-4">
          {relatando && (
            <div className="mb-4">
              <RelatoForm
                unidade={relatando}
                onFechar={() => setRelatando(null)}
                onEnviado={() => setTentativa((t) => t + 1)}
              />
            </div>
          )}
          {erro && (
            <div
              role="alert"
              className="mb-4 rounded-2xl border border-red-300/20 bg-red-950/70 p-4 text-red-100"
            >
              <p>{erro}</p>
              <button
                className="mt-2 font-semibold text-red-200 underline underline-offset-2"
                onClick={() => {
                  setErro(null);
                  setTentativa((t) => t + 1);
                }}
              >
                Tentar de novo
              </button>
            </div>
          )}
          {dados && dados.unidades.length === 0 && (
            <p className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 text-slate-200">
              Nenhuma unidade encontrada.
            </p>
          )}
          <ul className="space-y-3">
            {dados?.unidades.map((u) => (
              <UnidadeCard
                key={u.id}
                unidade={u}
                selecionada={selecionada === u.id}
                onSelecionar={(un) => setSelecionada(un.id)}
                onInformarEspera={() => setRelatando(u)}
              />
            ))}
          </ul>
        </div>
      </section>

      {carregando && <LoadingScreen />}
    </main>
  );
}
