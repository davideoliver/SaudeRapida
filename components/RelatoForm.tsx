"use client";

import { useState } from "react";
import { enviarRelato, type ErroDaApi } from "@/lib/api-client";
import { getDeviceId } from "@/lib/device";
import { LIMITES, type Unidade } from "@/types/unidade";

type Props = {
  unidade: Unidade;
  onFechar: () => void;
  onEnviado: () => void; // a página recarrega a lista
};

export default function RelatoForm({ unidade, onFechar, onEnviado }: Props) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  async function aoEnviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setErro(null);

    // Validação no navegador: conforto para o usuário.
    // O servidor valida DE NOVO, porque o navegador pode ser burlado.
    if (!/^\d+$/.test(texto.trim())) {
      setErro("Digite apenas números inteiros, sem vírgula.");
      return;
    }
    const minutos = Number(texto.trim());
    if (minutos < LIMITES.MINUTOS_MIN || minutos > LIMITES.MINUTOS_MAX) {
      setErro(
        `Informe um tempo entre ${LIMITES.MINUTOS_MIN} e ${LIMITES.MINUTOS_MAX} minutos.`,
      );
      return;
    }

    setEnviando(true);
    try {
      await enviarRelato({
        unidade_id: unidade.id,
        minutos,
        device_id: getDeviceId(),
      });
      setEnviado(true);
      onEnviado();
    } catch (falha) {
      // 422, 404 e 429 chegam aqui com a mensagem pronta do servidor.
      // Sem internet, o fetch lança outro tipo de erro, sem "mensagem".
      const e = falha as Partial<ErroDaApi>;
      setErro(
        e.mensagem ?? "Sem conexão. Verifique a internet e tente de novo.",
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border bg-white p-4 text-gray-900 shadow-sm">
      <h2 className="font-semibold">Informar minha espera</h2>
      <p className="text-sm text-gray-600">{unidade.nome}</p>

      {enviado ? (
        <div className="mt-3">
          <p role="status" className="rounded bg-green-100 p-2 text-green-900">
            Obrigado! Seu relato foi registrado.
          </p>
          <button
            onClick={onFechar}
            className="mt-3 min-h-11 rounded border px-4"
          >
            Fechar
          </button>
        </div>
      ) : (
        <form onSubmit={aoEnviar} className="mt-3 space-y-3">
          <label htmlFor="minutos" className="block text-sm">
            Quantos minutos você esperou (ou está esperando)?
          </label>
          <input
            id="minutos"
            inputMode="numeric"
            value={texto}
            onChange={(ev) => setTexto(ev.target.value)}
            className="min-h-11 w-full rounded border bg-white p-2 text-gray-900"
            placeholder="Ex.: 40"
            autoFocus
          />
          {erro && (
            <p
              role="alert"
              className="rounded bg-red-100 p-2 text-sm text-red-900"
            >
              {erro}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={enviando}
              className="min-h-11 rounded bg-blue-600 px-4 text-white disabled:opacity-50"
            >
              {enviando ? "Enviando…" : "Enviar"}
            </button>
            <button
              type="button"
              onClick={onFechar}
              className="min-h-11 rounded border bg-white px-4 text-gray-900"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
