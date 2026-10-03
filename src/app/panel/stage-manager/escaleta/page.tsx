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
    cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    siguiente: "escena",
    accion: "Poner en escena",
  },
  escena: {
    label: "En escena",
    cls: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    siguiente: "fin",
    accion: "Terminar",
  },
  fin: {
    label: "Terminado",
    cls: "bg-neutral-100 text-neutral-400 dark:bg-neutral-900 dark:text-neutral-500",
    siguiente: "espera",
    accion: "Reponer",
  },
};

export default function EscaletaPage() {
  const { roles, loading: cargandoAuth } = useAuth();
  const puedeEditar =
    roles["stage-manager"] === "titular" || roles["grupo-base"] === "titular";
  const puedeVer = Boolean(roles["stage-manager"] || roles["grupo-base"]);

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
        <p className="text-sm text-neutral-500">Cargando…</p>
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-neutral-500">
          Este panel es para Stage Manager y Grupo Base.
        </p>
        <Link href="/panel" className="mt-2 text-sm underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-5">
        <Link
          href="/panel/stage-manager"
          className="text-xs text-neutral-500 underline"
        >
          ← Panel Stage Manager
        </Link>
        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-bold">Escaleta en directo</h1>
          <span className="text-xs text-neutral-500">
            {ultimaAct ? `Actualizado ${ultimaAct}` : "Conectando…"}
            {guardando && " · guardando…"}
          </span>
        </div>
        <p className="mt-1 text-sm text-neutral-500">
          Orden de actuación de la Jam. Los cambios se sincronizan cada{" "}
          {POLL_MS / 1000} s.
        </p>
      </header>

      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {turnos === null ? (
        <p className="text-sm text-neutral-500">Cargando escaleta…</p>
      ) : turnos.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-400 dark:border-neutral-700">
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
                className={`rounded-2xl border p-4 transition ${
                  enEscena
                    ? "border-green-500 bg-green-50/50 dark:bg-green-950/30"
                    : t.estado === "fin"
                      ? "border-neutral-200 opacity-60 dark:border-neutral-800"
                      : "border-neutral-200 dark:border-neutral-800"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 text-sm font-bold tabular-nums text-neutral-400">
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
                      <p className="mt-0.5 text-sm text-neutral-500">
                        {t.interpretes}
                      </p>
                    )}
                    <span
                      className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}
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
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-sm disabled:opacity-30 dark:border-neutral-700"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => mover(i, 1)}
                          disabled={i === turnos.length - 1 || guardando}
                          aria-label="Bajar"
                          className="rounded-lg border border-neutral-300 px-2.5 py-1 text-sm disabled:opacity-30 dark:border-neutral-700"
                        >
                          ↓
                        </button>
                      </div>
                      <button
                        onClick={() => cambiarEstado(i)}
                        disabled={guardando}
                        className="rounded-lg bg-neutral-900 px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-black"
                      >
                        {meta.accion}
                      </button>
                      <button
                        onClick={() => eliminar(i)}
                        disabled={guardando}
                        aria-label="Eliminar turno"
                        className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 disabled:opacity-50 dark:border-red-900"
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
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <input
            type="text"
            value={nuevoInterprete}
            onChange={(e) => setNuevoInterprete(e.target.value)}
            placeholder="Intérpretes (opcional)"
            maxLength={120}
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={guardando || nuevoTitulo.trim().length < 2}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Añadir
          </button>
        </form>
      )}
    </div>
  );
}
