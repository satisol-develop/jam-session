"use client";

import { useEffect, useState } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";

interface EventoLog {
  ts: string;
  uid: string;
  usuario: string;
  accion: string;
  detalle: string;
}

function formatTs(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Últimos movimientos de la hoja LogActividad (solo admin). */
export function AuditPanel() {
  const [intento, setIntento] = useState(0);
  const [datos, setDatos] = useState<{
    intento: number;
    eventos: EventoLog[] | null;
    error: string | null;
  }>({ intento: 0, eventos: null, error: null });

  useEffect(() => {
    api<{ eventos: EventoLog[] }>("admin.audit", { limite: 200 })
      .then((d) =>
        setDatos({ intento, eventos: d.eventos ?? [], error: null }),
      )
      .catch((err) =>
        setDatos({
          intento,
          eventos: [],
          error: err instanceof Error ? err.message : "No se pudo cargar.",
        }),
      );
  }, [intento]);

  // Cambiando de `intento` (retry) se vuelve al esqueleto sin setState
  // síncrono dentro del effect.
  const eventos = datos.intento === intento ? datos.eventos : null;
  const error = datos.intento === intento ? datos.error : null;

  if (error) {
    return (
      <div className="space-y-2">
        <p className="db-error text-sm">{error}</p>
        <button
          type="button"
          onClick={() => setIntento((n) => n + 1)}
          className="db-kicker inline-flex min-h-10 items-center gap-1.5 text-xs underline"
        >
          Reintentar
        </button>
      </div>
    );
  }
  if (eventos === null) return <SkeletonFilas n={5} />;
  if (eventos.length === 0) {
    return <p className="db-muted text-sm">Todavía no hay actividad registrada.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {eventos.map((r, i) => (
        <li
          key={`${r.ts}-${r.accion}-${i}`}
          className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 rounded-lg border border-white/10 px-3 py-2 text-xs"
        >
          <span className="db-muted shrink-0 tabular-nums">{formatTs(r.ts)}</span>
          <span className="font-semibold">{r.usuario}</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">
            {r.accion}
          </span>
          <span
            className="db-muted min-w-0 flex-1 break-words sm:truncate"
            title={r.detalle}
          >
            {r.detalle}
          </span>
        </li>
      ))}
    </ul>
  );
}
