"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { INSTRUMENTOS } from "@/lib/constants";
import type { Cancion, Inscripcion, SolicitudTema } from "@/types";

interface Props {
  inscripcion: Inscripcion | null;
  onSaved: (inscripcion: Inscripcion) => void;
  /** El Grupo Base ha cerrado las inscripciones. */
  cerradas?: boolean;
  ensayo?: string;
}

function initialSelection(inscripcion: Inscripcion | null): Record<string, string> {
  const map: Record<string, string> = {};
  inscripcion?.temas.forEach((t) => {
    map[t.temaId] = t.instrumento;
  });
  return map;
}

export function SubscribeForm({ inscripcion, onSaved, cerradas, ensayo }: Props) {
  const [catalogo, setCatalogo] = useState<Cancion[] | null>(null);
  const [instrumentos, setInstrumentos] = useState<string[]>(
    inscripcion?.instrumentos ?? [],
  );
  const [seleccion, setSeleccion] = useState<Record<string, string>>(() =>
    initialSelection(inscripcion),
  );
  const [notas, setNotas] = useState(inscripcion?.notas ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    api<{ catalogo: Cancion[] }>("public.catalog")
      .then((d) => setCatalogo(d.catalogo ?? []))
      .catch(() => setCatalogo([]));
  }, []);

  function toggleInstrumento(name: string) {
    setInstrumentos((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name],
    );
    setOk(false);
  }

  function toggleTema(id: string) {
    setSeleccion((prev) => {
      const next = { ...prev };
      if (id in next) {
        delete next[id];
      } else {
        next[id] = instrumentos[0] ?? INSTRUMENTOS[0];
      }
      return next;
    });
    setOk(false);
  }

  function setInstrumentoTema(id: string, instrumento: string) {
    setSeleccion((prev) => ({ ...prev, [id]: instrumento }));
    setOk(false);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);

    const temas: SolicitudTema[] = Object.entries(seleccion).map(
      ([temaId, instrumento]) => {
        const cancion = catalogo?.find((c) => c.id === temaId);
        return {
          temaId,
          titulo: cancion?.titulo ?? "",
          instrumento,
        };
      },
    );

    if (instrumentos.length === 0) {
      setError("Selecciona al menos un instrumento.");
      return;
    }
    if (temas.length === 0) {
      setError("Selecciona al menos un tema.");
      return;
    }

    setBusy(true);
    try {
      const guardada = await api<Inscripcion>("musician.subscribe", {
        instrumentos,
        temas,
        notas,
      });
      onSaved(guardada);
      setOk(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  const opcionesInstrumento =
    instrumentos.length > 0 ? instrumentos : [...INSTRUMENTOS];

  if (cerradas) {
    return (
      <div className="space-y-2 rounded-xl border border-neutral-200 p-4 text-sm dark:border-neutral-800">
        <p className="font-semibold">Inscripciones cerradas</p>
        <p className="text-neutral-500">
          El Grupo Base ha cerrado la inscripción de esta sesión.
          {ensayo && ` Ensayo general: ${ensayo}.`}
        </p>
        {inscripcion && (
          <p className="text-neutral-500">
            Tu inscripción enviada se conserva (solo lectura):{" "}
            {inscripcion.instrumentos.join(", ") || "—"} ·{" "}
            {inscripcion.temas.length}{" "}
            {inscripcion.temas.length === 1 ? "tema" : "temas"}.
          </p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          ¿En qué instrumentos tocas?
        </legend>
        <div className="flex flex-wrap gap-2">
          {INSTRUMENTOS.map((inst) => {
            const active = instrumentos.includes(inst);
            return (
              <button
                key={inst}
                type="button"
                onClick={() => toggleInstrumento(inst)}
                aria-pressed={active}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? "border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-neutral-300 hover:border-neutral-500 dark:border-neutral-700"
                }`}
              >
                {inst}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Temas en los que quieres participar
        </legend>
        {catalogo === null ? (
          <p className="text-sm text-neutral-500">Cargando repertorio…</p>
        ) : catalogo.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Aún no hay repertorio publicado.
          </p>
        ) : (
          <ul className="space-y-2">
            {catalogo.map((c) => {
              const checked = c.id in seleccion;
              return (
                <li
                  key={c.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 dark:border-neutral-800"
                >
                  <label className="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTema(c.id)}
                      className="size-4 accent-red-500"
                    />
                    <span className="text-sm font-medium">{c.titulo}</span>
                    <span className="text-xs text-neutral-500">
                      {c.artista}
                    </span>
                  </label>
                  {checked && (
                    <select
                      value={seleccion[c.id]}
                      onChange={(e) =>
                        setInstrumentoTema(c.id, e.target.value)
                      }
                      className="rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
                    >
                      {opcionesInstrumento.map((i) => (
                        <option key={i} value={i}>
                          {i}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </fieldset>

      <fieldset>
        <label
          htmlFor="notas"
          className="mb-2 block text-sm font-semibold"
        >
          Notas para el Grupo Base (opcional)
        </label>
        <textarea
          id="notas"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="Ej.: puedo entrar en el tema 3, pero llegaré 15 min tarde."
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
      </fieldset>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          ¡Inscripción guardada! El Grupo Base revisará las asignaciones.
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {busy
          ? "Guardando…"
          : inscripcion
            ? "Actualizar mi inscripción"
            : "Enviar inscripción"}
      </button>
    </form>
  );
}
