import type { MouseEvent } from "react";
import type { Unidade } from "@/types/unidade";

export type UnidadeCardData = Pick<
  Unidade,
  | "id"
  | "nome"
  | "endereco"
  | "espera_min"
  | "viagem_min"
  | "total_min"
  | "fonte_viagem"
>;

type UnidadeCardProps = {
  unidade: UnidadeCardData;
  selecionada?: boolean;
  onSelecionar: (unidade: UnidadeCardData) => void;
  onInformarEspera: (unidade: UnidadeCardData) => void;
};

function formatarMinutos(minutos: number): string {
  return `${minutos} min`;
}

export default function UnidadeCard({
  unidade,
  selecionada = false,
  onSelecionar,
  onInformarEspera,
}: UnidadeCardProps) {
  const corDoTempo = unidade.total_min < 40 ? "text-emerald-400" : "text-red-400";
  const handleInformarEspera = (event: MouseEvent<HTMLButtonElement>) => {
    // Impede que o clique também selecione a unidade no mapa.
    event.stopPropagation();
    onInformarEspera(unidade);
  };

  return (
    <li>
    {/* Cada cartão é um item válido da lista de unidades. */}
		<article
      className={`rounded-2xl border bg-slate-900/80 p-4 text-white shadow-lg shadow-slate-950/10 backdrop-blur-md transition-colors ${
        selecionada
          ? "border-red-400/70 ring-2 ring-red-400/20"
          : "border-white/10"
      }`}
    >
      <button
        type="button"
        onClick={() => onSelecionar(unidade)}
        aria-pressed={selecionada}
        className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        <h2 className="text-lg font-semibold text-white">{unidade.nome}</h2>
        <p className="mt-1 text-sm text-slate-300">{unidade.endereco}</p>

        <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-slate-400">Espera</p>
            <p className="font-medium text-slate-100">
              {unidade.espera_min === null
                ? "sem relatos recentes"
                : formatarMinutos(unidade.espera_min)}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Viagem</p>
            <p className="font-medium text-slate-100">
              {formatarMinutos(unidade.viagem_min)}{" "}
              {unidade.fonte_viagem === "estimado" && (
                <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-xs font-semibold text-amber-950">
                  estimado
                </span>
              )}
            </p>
          </div>

          <div>
            <p className="text-slate-400">Total</p>
            <p className={`text-2xl font-bold leading-tight ${corDoTempo}`}>
              {formatarMinutos(unidade.total_min)}
            </p>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={handleInformarEspera}
        className="mt-4 w-full rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:border-emerald-300/50 hover:bg-emerald-400/10 hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
      >
        Informar minha espera
      </button>
    </article>
    </li>
  );
}
