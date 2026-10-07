"use client";

import { useEffect, useState } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import type { Inscripcion } from "@/types";

interface LineaInstrumento {
  instrumento: string;
  musicos: { nombre: string; temas: string[] }[];
}

export function InstrumentosPanel() {
  const [lineas, setLineas] = useState<LineaInstrumento[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sinConfirmar, setSinConfirmar] = useState(0);

  useEffect(() => {
    api<{ inscripciones: Inscripcion[] }>("event.inscripciones")
      .then((res) => {
        const mapa = new Map<string, LineaInstrumento["musicos"]>();
        let pendientes = 0;
        for (const i of res.inscripciones ?? []) {
          if (i.estado === "pendiente") pendientes += 1;
          for (const inst of i.instrumentos) {
            const lista = mapa.get(inst) ?? [];
            lista.push({
              nombre: i.nombre,
              temas: i.temas
                .filter((t) => t.instrumento === inst)
                .map((t) => t.titulo),
            });
            mapa.set(inst, lista);
          }
        }
        setSinConfirmar(pendientes);
        setLineas(
          Array.from(mapa, ([instrumento, musicos]) => ({
            instrumento,
            musicos,
          })).sort((a, b) => b.musicos.length - a.musicos.length),
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setLineas([]);
      });
  }, []);

  if (lineas === null) {
    return <SkeletonFilas n={4} />;
  }

  if (lineas.length === 0) {
    return (
      <p className="db-muted text-sm">
        Sin inscripciones: aún no hay instrumentos confirmados para este evento.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="db-error">{error}</p>}

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="db-badge db-badge-solid">
          {lineas.length} líneas
        </span>
        <span className="db-badge db-badge-line">
          {sinConfirmar} inscripciones pendientes de asignar
        </span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {lineas.map((l) => (
          <li key={l.instrumento} className="rounded-xl border border-white/12 p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="db-title text-sm">{l.instrumento}</span>
              <span className="text-lg font-black tabular-nums text-[#FFE600]">
                {l.musicos.length}
              </span>
            </div>
            <ul className="db-muted mt-2 space-y-1 text-sm">
              {l.musicos.map((m, idx) => (
                <li key={`${l.instrumento}-${idx}`}>
                  {m.nombre}
                  {m.temas.length > 0 && (
                    <span className="text-white/55"> · {m.temas.join(", ")}</span>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="db-muted text-xs">
        Necesidades de equipo a partir de estas líneas: microfonías, líneas y
        monitores según la guía de proceso del rol.
      </p>
    </div>
  );
}
