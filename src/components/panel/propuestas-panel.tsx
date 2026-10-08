"use client";

import { useEffect, useState } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import type { Propuesta } from "@/types";

const fmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function PropuestasPanel({ editable }: { editable: boolean }) {
  const [propuestas, setPropuestas] = useState<Propuesta[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [seleccion, setSeleccion] = useState<string[]>([]);

  useEffect(() => {
    api<{ propuestas: Propuesta[] }>("proposal.list")
      .then((res) => setPropuestas(res.propuestas ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setPropuestas([]);
      });
  }, []);

  function alternar(id: string) {
    setSeleccion((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setError(null);
  }

  function marcarTodas() {
    const pendientes = (propuestas ?? [])
      .filter((p) => p.estado === "pendiente")
      .map((p) => p.id);
    setSeleccion(pendientes);
  }

  async function resolverLote(estado: "aprobada" | "rechazada") {
    if (busy || seleccion.length === 0) return;
    setBusy(true);
    setError(null);
    setOk(null);
    const resueltas: Propuesta[] = [];
    try {
      for (const id of seleccion) {
        resueltas.push(await api<Propuesta>("proposal.resolve", { id, estado }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo validar.");
    } finally {
      if (resueltas.length > 0) {
        const ids = new Set(resueltas.map((r) => r.id));
        setPropuestas((prev) =>
          (prev ?? []).map((p) => resueltas.find((r) => r.id === p.id) ?? p),
        );
        setSeleccion((prev) => prev.filter((id) => !ids.has(id)));
        setOk(
          `${resueltas.length} ${resueltas.length === 1 ? "propuesta" : "propuestas"} ${
            estado === "aprobada" ? "aprobada" : "rechazada"
          }${resueltas.length === 1 ? "" : "s"}.`,
        );
      }
      setBusy(false);
    }
  }

  if (propuestas === null) {
    return <SkeletonFilas n={3} />;
  }

  if (propuestas.length === 0) {
    return (
      <p className="db-muted text-sm">
        No hay propuestas de repertorio. Los músicos proponen canciones desde
        «Mi zona».
      </p>
    );
  }

  const pendientes = propuestas.filter((p) => p.estado === "pendiente");

  return (
    <div className="space-y-4">
      {error && (
        <p className="db-error" role="alert">
          {error}
        </p>
      )}
      {ok && (
        <p className="db-ok" role="status">
          {ok}
        </p>
      )}

      {editable && pendientes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={marcarTodas}
            type="button"
            disabled={busy}
            className="db-muted inline-flex min-h-10 items-center text-xs underline transition hover:text-white disabled:opacity-50"
          >
            Seleccionar todas
          </button>
          <button
            onClick={() => setSeleccion([])}
            type="button"
            disabled={busy}
            className="db-muted inline-flex min-h-10 items-center text-xs underline transition hover:text-white disabled:opacity-50"
          >
            Ninguna
          </button>
          <span className="db-muted w-full text-xs sm:ml-auto sm:w-auto">
            {seleccion.length} de {pendientes.length} pendientes seleccionadas
          </span>
        </div>
      )}

      <ul className="space-y-3">
        {propuestas.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/12 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                {editable && p.estado === "pendiente" && (
                  <input
                    type="checkbox"
                    checked={seleccion.includes(p.id)}
                    onChange={() => alternar(p.id)}
                    disabled={busy}
                    aria-label={`Seleccionar «${p.cancion}» de ${p.nombre}`}
                    className="size-4.5 accent-[#FFE600]"
                  />
                )}
                <span className="min-w-0 break-words">{p.nombre}</span>
              </label>
              <span
                className={`db-badge ${
                  p.estado === "aprobada"
                    ? "db-badge-solid"
                    : p.estado === "rechazada"
                      ? "db-badge-line border-red-400/50! text-red-300!"
                      : "db-badge-line"
                }`}
              >
                {p.estado}
              </span>
            </div>
            <p className="mt-1 break-words text-sm">
              «{p.cancion}»
              {p.artista ? ` — ${p.artista}` : ""}
              <span className="db-muted"> · {p.nombre} la tocaría en {p.instrumento}</span>
            </p>
            {p.archivos && p.archivos.length > 0 && (
              <p className="db-muted mt-1 text-xs">
                Ficheros:{" "}
                {p.archivos.map((a) => a.nombre).join(", ")}
              </p>
            )}
            <p className="db-muted mt-1 text-xs">{fmt.format(new Date(p.fecha))}</p>
          </li>
        ))}
      </ul>

      {editable && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => resolverLote("aprobada")}
            disabled={busy || seleccion.length === 0}
            className="db-btn text-xs!"
          >
            {busy ? "Validando…" : `Aprobar seleccionadas (${seleccion.length})`}
          </button>
          <button
            type="button"
            onClick={() => resolverLote("rechazada")}
            disabled={busy || seleccion.length === 0}
            className="min-h-10 rounded-xl border border-red-500/40 px-3 py-2 text-xs font-semibold text-red-300 uppercase transition hover:border-red-500 hover:text-red-200 disabled:opacity-50"
          >
            {busy
              ? "Validando…"
              : `Rechazar seleccionadas (${seleccion.length})`}
          </button>
        </div>
      )}

      {!editable && (
        <p className="db-muted text-xs">
          Solo lectura: el listado lo valida el rol General y el Grupo Base es
          quien decide el repertorio activo.
        </p>
      )}
    </div>
  );
}
