"use client";

import { useEffect, useState } from "react";
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
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<{ propuestas: Propuesta[] }>("proposal.list")
      .then((res) => setPropuestas(res.propuestas ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setPropuestas([]);
      });
  }, []);

  async function resolver(id: string, estado: "aprobada" | "rechazada") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Propuesta>("proposal.resolve", {
        id,
        estado,
      });
      setPropuestas((prev) =>
        (prev ?? []).map((p) => (p.id === actualizada.id ? actualizada : p)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo resolver.");
    } finally {
      setBusy(false);
    }
  }

  if (propuestas === null) {
    return <p className="db-muted text-sm">Cargando propuestas…</p>;
  }

  if (propuestas.length === 0) {
    return (
      <p className="db-muted text-sm">
        No hay propuestas de repertorio. Los músicos proponen temas desde «Mi
        zona».
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="db-error">{error}</p>}

      <ul className="space-y-3">
        {propuestas.map((p) => (
          <li key={p.id} className="rounded-xl border border-white/12 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm font-semibold">{p.nombre}</span>
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
            <p className="mt-1 text-sm">{p.texto}</p>
            <p className="db-muted mt-1 text-xs">{fmt.format(new Date(p.fecha))}</p>

            {editable && p.estado === "pendiente" ? (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => resolver(p.id, "aprobada")}
                  disabled={busy}
                  className="db-btn text-xs!"
                >
                  Aprobar
                </button>
                <button
                  onClick={() => resolver(p.id, "rechazada")}
                  disabled={busy}
                  className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs font-semibold uppercase text-red-300 disabled:opacity-50"
                >
                  Rechazar
                </button>
              </div>
            ) : (
              !editable && (
                <p className="db-muted mt-2 text-[11px]">
                  Solo lectura: el titular del rol General resuelve las
                  propuestas.
                </p>
              )
            )}
          </li>
        ))}
      </ul>

      <p className="db-muted text-xs">
        Una propuesta aprobada la recoge el Grupo Base en el repertorio activo
        del mes.
      </p>
    </div>
  );
}
