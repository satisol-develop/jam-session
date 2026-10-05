"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { INSTRUMENTOS } from "@/lib/constants";

interface PropuestaItem {
  id: string;
  cancion: string;
  artista: string;
  instrumento: string;
  estado: string;
  fecha: string;
}

const ESTADO_LABEL: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "En repertorio",
  rechazada: "Descartada",
};

export function ProposeForm() {
  const [cancion, setCancion] = useState("");
  const [artista, setArtista] = useState("");
  const [instrumento, setInstrumento] = useState("");
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
      const res = await api<{ id: string }>("musician.propose", {
        cancion,
        artista,
        instrumento,
        texto: `Quiero tocar «${cancion.trim()}»${artista.trim() ? ` de ${artista.trim()}` : ""} en ${instrumento}.`,
      });
      setPropuestas((prev) => [
        {
          id: res.id,
          cancion: cancion.trim(),
          artista: artista.trim(),
          instrumento,
          estado: "pendiente",
          fecha: new Date().toISOString(),
        },
        ...prev,
      ]);
      setCancion("");
      setArtista("");
      setInstrumento("");
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
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="cancion" className="block text-sm font-semibold">
              Canción
            </label>
            <input
              id="cancion"
              type="text"
              required
              maxLength={120}
              value={cancion}
              onChange={(e) => setCancion(e.target.value)}
              placeholder="Ej. September"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="artista" className="block text-sm font-semibold">
              Artista <span className="font-normal text-neutral-500">(opcional)</span>
            </label>
            <input
              id="artista"
              type="text"
              maxLength={120}
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              placeholder="Ej. Earth, Wind & Fire"
              className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="instrumento" className="block text-sm font-semibold">
            El instrumento con el que la tocarías
          </label>
          <select
            id="instrumento"
            required
            value={instrumento}
            onChange={(e) => setInstrumento(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white sm:text-sm"
          >
            <option value="">Elige un instrumento…</option>
            {INSTRUMENTOS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {ok && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            Propuesta enviada. El Grupo Base la tendrá en cuenta y el General
            decide si entra al repertorio.
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900 sm:w-auto"
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
              <span className="flex-1">
                «{p.cancion}»{p.artista ? ` — ${p.artista}` : ""}
                <span className="text-neutral-500 text-xs dark:text-neutral-400">
                  {" "}
                  · en {p.instrumento}
                </span>
              </span>
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
