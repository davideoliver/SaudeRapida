import type { MouseEvent } from "react";

type FonteViagem = "transito" | "estimado";

export type UnidadeCardData = {
	id: string;
	nome: string;
	endereco: string;
	espera_min: number | null;
	viagem_min: number;
	total_min: number;
	fonte_viagem: FonteViagem;
};

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
	const handleInformarEspera = (event: MouseEvent<HTMLButtonElement>) => {
		// Impede que o clique também selecione a unidade no mapa.
		event.stopPropagation();
		onInformarEspera(unidade);
	};

	return (
		<article
			className={`rounded-xl border bg-white p-4 shadow-sm transition-colors ${
				selecionada
					? "border-blue-600 ring-2 ring-blue-100"
					: "border-slate-200"
			}`}
		>
			<button
				type="button"
				onClick={() => onSelecionar(unidade)}
				aria-pressed={selecionada}
				className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
			>
				<h2 className="text-lg font-semibold text-slate-900">{unidade.nome}</h2>
				<p className="mt-1 text-sm text-slate-600">{unidade.endereco}</p>

				<div className="mt-4 grid grid-cols-3 gap-3 text-sm">
					<div>
						<p className="text-slate-500">Espera</p>
						<p className="font-medium text-slate-900">
							{unidade.espera_min === null
								? "sem relatos recentes"
								: formatarMinutos(unidade.espera_min)}
						</p>
					</div>

					<div>
						<p className="text-slate-500">Viagem</p>
						<p className="font-medium text-slate-900">
							{formatarMinutos(unidade.viagem_min)}{" "}
							{unidade.fonte_viagem === "estimado" && (
								<span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
									estimado
								</span>
							)}
						</p>
					</div>

					<div>
						<p className="text-slate-500">Total</p>
						<p className="text-2xl font-bold leading-tight text-blue-700">
							{formatarMinutos(unidade.total_min)}
						</p>
					</div>
				</div>
			</button>

			<button
				type="button"
				onClick={handleInformarEspera}
				className="mt-4 w-full rounded-lg border border-blue-600 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
			>
				Informar minha espera
			</button>
		</article>
	);
}
