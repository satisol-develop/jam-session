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
    return <p className="text-sm text-neutral-500">Cargando evento…</p>;
  }
  if (!evento) {
    return (
      <p className="text-sm text-neutral-500">
        No hay evento activo. Crea el evento del mes en la hoja Eventos.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold">{evento.titulo || "Evento sin título"}</span>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium dark:bg-neutral-900">
          {evento.estado}
        </span>
      </div>

      {evento.estado === "borrador" &&
        (puedeAprobar ? (
          <button
            onClick={aprobar}
            disabled={busy}
            className="rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? "Aprobando…" : "Aprobar sesión y generar tareas"}
          </button>
        ) : (
          <p className="text-xs text-neutral-500">
            Solo el titular del rol General puede aprobar la sesión.
          </p>
        ))}

      {ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {ok}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
