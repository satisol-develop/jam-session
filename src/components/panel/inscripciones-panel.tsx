"use client";

import { useEffect, useState } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import { descargarCsv } from "@/lib/csv";
import type { Inscripcion } from "@/types";

const ESTADOS = ["pendiente", "asignado", "parcial", "rechazado"] as const;

const ESTADO_BADGE: Record<Inscripcion["estado"], string> = {
  pendiente: "db-badge db-badge-line",
  asignado: "db-badge db-badge-solid",
  parcial: "db-badge db-badge-line",
  rechazado: "db-badge db-badge-line border-red-400/50! text-red-300!",
};

export function InscripcionesPanel({ editable }: { editable: boolean }) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ inscripciones: Inscripcion[] }>("event.inscripciones")
      .then((res) => setInscripciones(res.inscripciones ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setInscripciones([]);
      });
  }, []);

  async function cambiarEstado(id: string, estado: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Inscripcion>("musician.setEstado", {
        id,
        estado,
      });
      setInscripciones((prev) =>
        (prev ?? []).map((i) => (i.id === actualizada.id ? actualizada : i)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  function exportarCsv() {
    descargarCsv(
      "inscripciones",
      ["Nombre", "Instrumentos", "Temas", "Estado", "Notas", "Fecha"],
      (inscripciones ?? []).map((i) => [
        i.nombre,
        i.instrumentos.join(" | "),
        i.temas.map((t) => `${t.titulo} (${t.instrumento})`).join(" | "),
        i.estado,
        i.notas,
        i.fecha,
      ]),
    );
  }

  if (inscripciones === null) {
    return <SkeletonFilas n={3} />;
  }

  if (inscripciones.length === 0) {
    return (
      <p className="db-muted text-sm">
        Todavía no hay inscripciones para la próxima sesión.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {error ? (
          <p className="db-error">{error}</p>
        ) : (
          <p className="db-kicker">{inscripciones.length} inscripciones</p>
        )}
        <button type="button" onClick={exportarCsv} className="db-ghost text-xs!">
          Descargar CSV
        </button>
      </div>

      <ul className="space-y-3">
        {inscripciones.map((i) => (
          <li key={i.id} className="rounded-xl border border-white/12 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="min-w-0 break-words font-semibold">{i.nombre}</span>
              <span className={ESTADO_BADGE[i.estado]}>{i.estado}</span>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {i.instrumentos.map((inst) => (
                <span key={inst} className="db-badge db-badge-solid">
                  {inst}
                </span>
              ))}
            </div>

            <ul className="db-muted mt-2 space-y-0.5 text-sm">
              {i.temas.map((t, idx) => (
                <li key={`${i.id}-${idx}`}>
                  {t.titulo} <span className="text-white/55">· {t.instrumento}</span>
                </li>
              ))}
            </ul>

            {i.notas && (
              <p className="db-muted mt-2 text-xs italic">«{i.notas}»</p>
            )}

            {editable ? (
              <label className="mt-3 flex items-center gap-2 text-xs">
                <span className="db-kicker">Estado</span>
                <select
                  value={i.estado}
                  onChange={(e) => cambiarEstado(i.id, e.target.value)}
                  disabled={busy}
                  className="db-input w-auto! py-1.5!"
                >
                  {ESTADOS.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="db-muted mt-2 text-xs">
                Solo lectura: el Grupo Base asigna los estados.
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
