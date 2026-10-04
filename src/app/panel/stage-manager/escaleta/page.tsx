"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
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
    cls: "bg-white/5 text-white/40",
    siguiente: "espera",
    accion: "Reponer",
  },
};

export default function EscaletaPage() {
  const { roles, loading: cargandoAuth } = useAuth();
  const puedeEditar =
    roles["stage-manager"] === "titular" || roles["grupo-base"] === "titular";
  const puedeVer = Boolean(
    roles["stage-manager"] || roles["grupo-base"] || roles["admin"],
  );

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

  if (cargandoAuth) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="db-muted text-sm">Cargando…</p>
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="db-muted text-sm">
          Este panel es para Stage Manager y Grupo Base (y el administrador en
          modo lectura).
        </p>
        <Link href="/panel" className="mt-2 text-sm text-[#FFE600] underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <Link
          href="/panel"
          className="db-kicker underline"
        >
          ← Paneles
        </Link>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="db-title text-3xl sm:text-4xl">Escaleta en directo</h1>
          <span className="db-muted text-xs">
            {ultimaAct ? `Actualizado ${ultimaAct}` : "Conectando…"}
            {guardando && " · guardando…"}
          </span>
        </div>
        <p className="db-muted mt-1 text-sm">
          Orden de actuación de la Jam. Los cambios se sincronizan cada{" "}
          {POLL_MS / 1000} s.
        </p>
      </header>

      {error && <p className="db-error mb-4">{error}</p>}

      {turnos === null ? (
        <p className="db-muted text-sm">Cargando escaleta…</p>
      ) : turnos.length === 0 ? (
        <p className="db-card p-6 text-center text-sm db-muted">
          La escaleta está vacía. Añade el primer turno.
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
                      ? "opacity-50"
                      : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 text-sm font-bold tabular-nums text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`font-semibold ${
                        t.estado === "fin" ? "line-through" : ""
                      }`}
                    >
                      {t.titulo}
                    </p>
                    {t.interpretes && (
                      <p className="db-muted mt-0.5 text-sm">
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
                          className="db-ghost px-2.5! py-1! text-sm disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => mover(i, 1)}
                          disabled={i === turnos.length - 1 || guardando}
                          aria-label="Bajar"
                          className="db-ghost px-2.5! py-1! text-sm disabled:opacity-30"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => cambiarEstado(i)}
                        disabled={guardando}
                        className="db-btn px-2.5! py-1.5! text-xs!"
                      >
                        {meta.accion}
                      </button>
                      <button
                        onClick={() => eliminar(i)}
                        disabled={guardando}
                        aria-label="Eliminar turno"
                        className="rounded-lg border border-red-500/40 px-2.5 py-1 text-xs text-red-400 disabled:opacity-50"
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
            maxLength={120}
            className="db-input flex-1"
          />
          <input
            type="text"
            value={nuevoInterprete}
            onChange={(e) => setNuevoInterprete(e.target.value)}
            placeholder="Intérpretes (opcional)"
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
