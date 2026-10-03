"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";

interface PropuestaItem {
  id: string;
  texto: string;
  estado: string;
  fecha: string;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Descartada",
};

export function ProposeForm() {
  const [texto, setTexto] = useState("");
  const [propuestas, setPropuestas] = useState<PropuestaItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api<{ propuestas: PropuestaItem[] }>("musician.myProposals")
      .then((d) => setPropuestas(d.propuestas ?? []))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);
    try {
      const res = await api<{ id: string }>("musician.propose", { texto });
      setPropuestas((prev) => [
        {
          id: res.id,
          texto: texto.trim(),
          estado: "pendiente",
          fecha: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTexto("");
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <label htmlFor="propuesta" className="block text-sm font-semibold">
          Propon un tema nuevo
        </label>
        <textarea
          id="propuesta"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={2}
          maxLength={500}
          required
          placeholder="Título, artista y cualquier detalle (tono, versión…)"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Propuesta enviada. El equipo la evaluará.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {busy ? "Enviando…" : "Enviar propuesta"}
        </button>
      </form>

      {propuestas.length > 0 && (
        <ul className="space-y-2">
          {propuestas.map((p) => (
            <li
              key={p.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <span className="flex-1">{p.texto}</span>
              <span className="shrink-0 text-xs text-neutral-500">
                {ESTADO_LABEL[p.estado] ?? p.estado}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
