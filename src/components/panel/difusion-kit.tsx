"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Evento } from "@/types";

const fmtFecha = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
});

export function DifusionKit() {
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [copiado, setCopiado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ evento: Evento | null }>("public.event")
      .then((res) => setEvento(res.evento ?? null))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setEvento(null);
      });
  }, []);

  if (evento === undefined) {
    return <p className="db-muted text-sm">Cargando evento…</p>;
  }
  if (error) {
    return <p className="db-error">{error}</p>;
  }
  if (!evento) {
    return (
      <p className="db-muted text-sm">
        No hay evento activo: crea el evento del mes para poder difundirlo.
      </p>
    );
  }

  const fecha = evento.fecha
    ? fmtFecha.format(new Date(evento.fecha))
    : "Fecha por confirmar";
  const url = typeof window !== "undefined" ? window.location.origin : "";

  async function copiar(texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* portapapeles no disponible */
    }
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 sm:grid-cols-2">
        {(
          [
            ["Título", evento.titulo],
            ["Fecha", fecha],
            ["Hora", evento.hora || "—"],
            ["Lugar", evento.lugar || "—"],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-white/12 p-3">
            <dt className="db-kicker mb-1">{k}</dt>
            <dd className="text-sm font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="rounded-xl border border-white/12 p-3">
        <p className="db-kicker mb-1">Texto base para el cartel</p>
        <p className="text-sm">
          {evento.titulo} — {fecha} · {evento.hora} · {evento.lugar}. ¡Toca con
          nosotros! #DebarockKolektiboa
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => copiar(url)} className="db-btn text-xs!" disabled={!url}>
          {copiado ? "¡Copiado!" : "Copiar enlace"}
        </button>
        <button
          onClick={() =>
            copiar(
              `${evento.titulo} — ${fecha} · ${evento.hora} · ${evento.lugar}. ¡Toca con nosotros! #DebarockKolektiboa`,
            )
          }
          className="db-ghost text-xs!"
        >
          Copiar texto del cartel
        </button>
      </div>

      <p className="db-muted text-xs">
        Cobertura audiovisual y publicaciones se registran como tareas del rol
        en la lista de arriba.
      </p>
    </div>
  );
}
