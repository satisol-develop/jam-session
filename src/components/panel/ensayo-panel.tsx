"use client";

import { useEffect, useState } from "react";
import { SkeletonFilas } from "@/components/loading";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import type { Evento } from "@/types";

function formatearEnsayo(valor: string): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function EnsayoPanel() {
  const { roles } = useAuth();
  const esTitular = roles["grupo-base"] === "titular";
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [ensayo, setEnsayo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function aplicar(ev: Evento | null) {
    setEvento(ev);
    if (ev) setEnsayo(ev.ensayo ?? "");
  }

  function recargar() {
    return api<{ evento: Evento | null }>("public.event")
      .then((res) => aplicar(res.evento ?? null))
      .catch(() => aplicar(null));
  }

  useEffect(() => {
    api<{ evento: Evento | null }>("public.event")
      .then((res) => {
        const ev = res.evento ?? null;
        setEvento(ev);
        if (ev) setEnsayo(ev.ensayo ?? "");
      })
      .catch(() => setEvento(null));
  }, []);

  async function guardarEnsayo() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("event.setEnsayo", { ensayo });
      setOk("Ensayo general guardado.");
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function alternarInscripciones() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("event.setInscripciones", {
        cerradas: !(evento?.inscripcionesCerradas ?? false),
      });
      setOk(
        evento?.inscripcionesCerradas
          ? "Inscripciones reabiertas."
          : "Inscripciones cerradas.",
      );
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  if (evento === undefined) {
    return <SkeletonFilas n={3} />;
  }
  if (!evento) {
    return (
      <p className="db-muted text-sm">
        No hay evento activo: crea el evento del mes primero.
      </p>
    );
  }

  const cerradas = evento.inscripcionesCerradas ?? false;
  const congelado = evento.estado === "realizado";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span
          className={`db-badge ${cerradas ? "db-badge-solid" : "db-badge-line"}`}
        >
          Inscripciones {cerradas ? "cerradas" : "abiertas"}
        </span>
        {evento.ensayo && (
          <span className="db-muted text-xs">
            Ensayo general: {formatearEnsayo(evento.ensayo)}
          </span>
        )}
      </div>

      {congelado ? (
        <p className="db-muted text-xs">
          El evento está cerrado: ensayo e inscripciones quedan congelados.
        </p>
      ) : esTitular ? (
        <>
          <label className="block text-xs font-semibold" htmlFor="ensayo">
            Ensayo general (fecha y hora)
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <input
              id="ensayo"
              type="datetime-local"
              value={ensayo}
              onChange={(e) => {
                setEnsayo(e.target.value);
                setOk(null);
              }}
              className="db-input flex-1"
            />
            <button
              onClick={guardarEnsayo}
              disabled={busy}
              className="db-btn text-xs!"
            >
              {busy ? "Guardando…" : "Guardar ensayo"}
            </button>
          </div>
          <button
            onClick={alternarInscripciones}
            disabled={busy}
            className="db-ghost text-xs!"
          >
            {cerradas ? "Reabrir inscripciones" : "Cerrar inscripciones"}
          </button>
        </>
      ) : (
        <p className="db-muted text-xs">
          El ensayo general y el cierre de inscripciones los gestiona el titular
          del Grupo Base.
        </p>
      )}

      <p className="db-muted text-xs">
        ≈1 semana antes: fija el ensayo general y cierra las inscripciones
        cuando quieras anunciarlo (recomendado: unos días antes de la Jam);
        después pide a Redes que difunda la fecha.
      </p>

      {ok && (
        <p className="db-ok" role="status">
          {ok}
        </p>
      )}
      {error && (
        <p className="db-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
