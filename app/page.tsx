"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { buscarUnidades } from "@/lib/api-client";
import type { RespostaUnidades } from "@/types/unidade";
import UnidadeCard, { type UnidadeCardData } from "@/components/UnidadeCard";

// Leaflet usa "window": só pode rodar no navegador.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-200" />,
});

export default function Home() {
  const { pos, estado } = useGeolocation();
  // Mantém a unidade selecionada para o relato dentro do componente React.
  const [unidadeRelato, setUnidadeRelato] = useState<UnidadeCardData | null>(
    null,
  );
  const [dados, setDados] = useState<RespostaUnidades | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

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

  return (
    <main className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-bold">Saúde Rápida</h1>

      {(estado === "negado" || estado === "indisponivel") && (
        <p className="my-2 rounded bg-yellow-100 p-2 text-sm text-yellow-900">
          Não conseguimos sua localização. Mostrando o centro da cidade.
        </p>
      )}

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="h-72 overflow-hidden rounded-xl md:h-[70vh]">
          <MapView
            origem={dados?.origem ?? pos}
            unidades={dados?.unidades ?? []}
            onSelecionar={setSelecionada}
          />
        </div>

        <section>
          {erro && (
            <div className="rounded bg-red-100 p-3 text-red-900">
              {erro}{" "}
              <button
                className="underline"
                onClick={() => {
                  setErro(null);
                  setTentativa((t) => t + 1);
                }}
              >
                Tentar de novo
              </button>
            </div>
          )}
          {!dados && !erro && <p>Carregando unidades…</p>}
          {dados && dados.unidades.length === 0 && (
            <p>Nenhuma unidade encontrada.</p>
          )}
          <ul className="space-y-3">
            {dados?.unidades.map((u) => (
              <li key={u.id}>
                <UnidadeCard
                  unidade={u}
                  selecionada={selecionada === u.id}
                  onSelecionar={(un) => setSelecionada(un.id)}
                  onInformarEspera={(un) => setUnidadeRelato(un)}
                />
              </li>
            ))}
          </ul>

          {/* Provisório: troque pelo <RelatoForm /> na Fase C */}
          {unidadeRelato && (
            <p className="mt-4 rounded bg-blue-50 p-3 text-sm">
              Formulário de relato para <strong>{unidadeRelato.nome}</strong>{" "}
              (em construção).
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
