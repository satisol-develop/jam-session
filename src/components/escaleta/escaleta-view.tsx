"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import type { EstadoTurno, Turno } from "@/types";

const POLL_MS = 4000;

const ESTADO_META: Record<
  EstadoTurno,
  { label: string; cls: string; siguiente: EstadoTurno; accion: string }
> = {
  espera: {
    label: "En espera",
    cls: "bg-white/10 text-white/70",
    siguiente: "escena",
    accion: "Poner en escena",
  },
  escena: {
    label: "En escena",
    cls: "bg-[#FFE600] text-black",
    siguiente: "fin",
    accion: "Terminar",
  },
  fin: {
    label: "Terminado",
    cls: "bg-white/5 text-white/55",
    siguiente: "espera",
    accion: "Reponer",
  },
};

/**
 * Vista operativa de la escaleta: sondea el servidor cada 4 s, permite
 * reordenar / cambiar estado / añadir y borrar turnos cuando `puedeEditar`
 * (titular de Stage Manager o Grupo Base; el backend vuelve a verificarlo).
 * Se usa incrustada en los paneles (Grupo Base, General, admin) y dentro
 * de la página dedicada /panel/stage-manager/escaleta.
 */
export function EscaletaView({ puedeEditar }: { puedeEditar: boolean }) {
  const [turnos, setTurnos] = useState<Turno[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [ultimaAct, setUltimaAct] = useState("");
  const dirtyRef = useRef(false);
  const idCounter = useRef(0);

  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevoInterprete, setNuevoInterprete] = useState("");

  useEffect(() => {
    let activo = true;
    const tick = () => {
      if (!activo || dirtyRef.current) return;
      api<{ turnos: Turno[] }>("escaleta.list")
        .then((res) => {
          if (activo && !dirtyRef.current) {
            setTurnos(res.turnos ?? []);
            setUltimaAct(
              new Date().toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              }),
            );
          }
        })
        .catch((err) => {
          if (activo) {
            setError(err instanceof Error ? err.message : "Error de conexión.");
          }
        });
    };
    tick();
    const id = setInterval(tick, POLL_MS);
    return () => {
      activo = false;
      clearInterval(id);
    };
  }, []);

  async function guardar(nuevos: Turno[]) {
    setTurnos(nuevos);
    dirtyRef.current = true;
    setGuardando(true);
    setError(null);
    try {
      const res = await api<{ turnos: Turno[] }>("escaleta.save", {
        turnos: nuevos,
      });
      if (res.turnos) setTurnos(res.turnos);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      dirtyRef.current = false;
      setGuardando(false);
    }
  }

  function mover(index: number, dir: -1 | 1) {
    if (!turnos) return;
    const destino = index + dir;
    if (destino < 0 || destino >= turnos.length) return;
    const nuevos = [...turnos];
    [nuevos[index], nuevos[destino]] = [nuevos[destino], nuevos[index]];
    guardar(nuevos);
  }

  function cambiarEstado(index: number) {
    if (!turnos) return;
    const nuevos = turnos.map((t, i) =>
      i === index
        ? { ...t, estado: (ESTADO_META[t.estado] ?? ESTADO_META.espera).siguiente }
        : t,
    );
    guardar(nuevos);
  }

  function eliminar(index: number) {
    if (!turnos) return;
    const titulo = turnos[index]?.titulo ?? "este turno";
    if (!window.confirm(`¿Eliminar «${titulo}» de la escaleta?`)) return;
    guardar(turnos.filter((_, i) => i !== index));
  }

  function anadir(e: FormEvent) {
    e.preventDefault();
    if (!turnos || nuevoTitulo.trim().length < 2) return;
    guardar([
      ...turnos,
      {
        id: `local-${++idCounter.current}`,
        eventoId: "",
        orden: turnos.length + 1,
        temaId: "",
        titulo: nuevoTitulo.trim(),
        interpretes: nuevoInterprete.trim(),
        estado: "espera",
        duracionEst: "",
        updatedAt: "",
        updatedBy: "",
      },
    ]);
    setNuevoTitulo("");
    setNuevoInterprete("");
  }

  return (
    <div>
      <p className="db-muted mb-3 text-xs">
        {ultimaAct ? `Actualizado ${ultimaAct}` : "Conectando…"}
        {guardando && " · guardando…"} · se sincroniza cada {POLL_MS / 1000} s.
      </p>

      {error && (
        <p className="db-error mb-4" role="alert">
          {error}
        </p>
      )}

      {turnos === null ? (
        <SkeletonFilas n={4} />
      ) : turnos.length === 0 ? (
        <p className="db-card p-6 text-center text-sm db-muted">
          {puedeEditar
            ? "La escaleta está vacía. Añade el primer turno."
            : "La escaleta está vacía."}
        </p>
      ) : (
        <ol className="space-y-3">
          {turnos.map((t, i) => {
            const meta = ESTADO_META[t.estado] ?? ESTADO_META.espera;
            const enEscena = t.estado === "escena";
            return (
              <li
                key={t.id}
                className={`db-card p-4 transition ${
                  enEscena
                    ? "border-[#FFE600] bg-[#FFE600]/10"
                    : t.estado === "fin"
                      ? "opacity-60"
                      : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 text-sm font-bold tabular-nums text-white/50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`break-words font-semibold ${
                        t.estado === "fin" ? "line-through" : ""
                      }`}
                    >
                      {t.titulo}
                    </p>
                    {t.interpretes && (
                      <p className="db-muted mt-0.5 break-words text-sm">
                        {t.interpretes}
                      </p>
                    )}
                    <span
                      className={`db-badge mt-2 inline-flex ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </div>

                  {puedeEditar && (
                    <div className="flex shrink-0 flex-col gap-1.5">
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => mover(i, -1)}
                          disabled={i === 0 || guardando}
                          aria-label="Subir"
                          className="db-ghost min-h-11 min-w-11 px-2.5! py-1! text-sm disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => mover(i, 1)}
                          disabled={i === turnos.length - 1 || guardando}
                          aria-label="Bajar"
                          className="db-ghost min-h-11 min-w-11 px-2.5! py-1! text-sm disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => cambiarEstado(i)}
                        disabled={guardando}
                        className="db-btn min-h-11 px-3! py-2! text-xs!"
                      >
                        {meta.accion}
                      </button>
                      <button
                        onClick={() => eliminar(i)}
                        disabled={guardando}
                        aria-label="Eliminar turno"
                        className="min-h-11 rounded-xl border border-red-500/40 px-2.5 py-1 text-xs text-red-400 disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {puedeEditar && (
        <form
          onSubmit={anadir}
          className="mt-5 flex flex-col gap-2 sm:flex-row"
        >
          <input
            type="text"
            value={nuevoTitulo}
            onChange={(e) => setNuevoTitulo(e.target.value)}
            placeholder="Título del turno"
            aria-label="Título del turno"
            maxLength={120}
            className="db-input flex-1"
          />
          <input
            type="text"
            value={nuevoInterprete}
            onChange={(e) => setNuevoInterprete(e.target.value)}
            placeholder="Intérpretes (opcional)"
            aria-label="Intérpretes (opcional)"
            maxLength={120}
            className="db-input flex-1"
          />
          <button
            type="submit"
            disabled={guardando || nuevoTitulo.trim().length < 2}
            className="db-btn"
          >
            Añadir
          </button>
        </form>
      )}
    </div>
  );
}
