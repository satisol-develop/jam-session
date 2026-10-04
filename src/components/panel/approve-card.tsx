"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Evento } from "@/types";

export function ApproveCard({ puedeAprobar }: { puedeAprobar: boolean }) {
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    api<{ evento: Evento | null }>("public.event")
      .then((res) => setEvento(res.evento ?? null))
      .catch(() => setEvento(null));
  }, []);

  async function aprobar() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await api<{ tareasGeneradas: number }>("general.approve", {});
      setOk(`Sesión aprobada. ${res.tareasGeneradas} tareas generadas para los roles.`);
      const ev = await api<{ evento: Evento | null }>("public.event");
      setEvento(ev.evento ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aprobar.");
    } finally {
      setBusy(false);
    }
  }

  if (evento === undefined) {
    return <p className="db-muted text-sm">Cargando evento…</p>;
  }
  if (!evento) {
    return (
      <p className="db-muted text-sm">
        No hay evento activo. Crea el evento del mes en la hoja Eventos.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{evento.titulo || "Evento sin título"}</span>
        <span
          className={`db-badge ${
            evento.estado === "aprobado" ? "db-badge-solid" : "db-badge-line"
          }`}
        >
          {evento.estado}
        </span>
        <span className="db-muted text-xs">
          {evento.fecha} · {evento.hora} · {evento.lugar}
        </span>
      </div>

      {evento.estado === "borrador" &&
        (puedeAprobar ? (
          <button
            onClick={aprobar}
            disabled={busy}
            className="db-btn"
          >
            {busy ? "Aprobando…" : "Aprobar sesión y generar tareas"}
          </button>
        ) : (
          <p className="db-muted text-xs">
            Solo el titular del rol General puede aprobar la sesión.
          </p>
        ))}

      {ok && <p className="db-ok">{ok}</p>}
      {error && <p className="db-error">{error}</p>}
    </div>
  );
}
