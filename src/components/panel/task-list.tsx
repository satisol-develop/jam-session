"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import type { Rol, Tarea } from "@/types";

function fmtComentario(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
}

interface Props {
  rol: Rol;
  /** Muestra las tareas de todos los roles (vista global del admin). */
  todas?: boolean;
  /** Fuerza el modo solo lectura (ignora si el usuario es titular). */
  soloLectura?: boolean;
}

export function TaskList({ rol, todas = false, soloLectura = false }: Props) {
  const { roles } = useAuth();
  const esTitular = !soloLectura && roles[rol] === "titular";
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [nueva, setNueva] = useState("");
  const [nuevasSub, setNuevasSub] = useState<Record<string, string>>({});
  const [hilos, setHilos] = useState<Record<string, boolean>>({});
  const [nuevosCom, setNuevosCom] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ tareas: Tarea[] }>("task.list")
      .then((res) =>
        setTareas(todas ? res.tareas : res.tareas.filter((t) => t.rol === rol)),
      )
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setTareas([]);
      });
  }, [rol, todas]);

  function aplicar(actualizada: Tarea) {
    setTareas((prev) =>
      (prev ?? []).map((t) => (t.id === actualizada.id ? actualizada : t)),
    );
  }

  async function onToggle(tarea: Tarea) {
    if (!esTitular || busy) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Tarea>("task.toggle", { taskId: tarea.id });
      aplicar(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  async function onToggleSub(tarea: Tarea, subtaskId: string) {
    if (!esTitular || busy) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Tarea>("task.subtask.toggle", {
        taskId: tarea.id,
        subtaskId,
      });
      aplicar(actualizada);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar.");
    } finally {
      setBusy(false);
    }
  }

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!esTitular || busy) return;
    setBusy(true);
    setError(null);
    try {
      const tarea = await api<Tarea>("task.add", { rol, titulo: nueva });
      setTareas((prev) => [...(prev ?? []), tarea]);
      setNueva("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir.");
    } finally {
      setBusy(false);
    }
  }

  async function onAddSub(e: FormEvent, tarea: Tarea) {
    e.preventDefault();
    const titulo = (nuevasSub[tarea.id] ?? "").trim();
    if (!esTitular || busy || titulo.length < 3) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Tarea>("task.subtask.add", {
        taskId: tarea.id,
        titulo,
      });
      aplicar(actualizada);
      setNuevasSub((prev) => ({ ...prev, [tarea.id]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo añadir.");
    } finally {
      setBusy(false);
    }
  }

  async function onComentar(e: FormEvent, tarea: Tarea) {
    e.preventDefault();
    const texto = (nuevosCom[tarea.id] ?? "").trim();
    if (busy || !texto) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Tarea>("task.comment", {
        taskId: tarea.id,
        texto,
      });
      aplicar(actualizada);
      setNuevosCom((prev) => ({ ...prev, [tarea.id]: "" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo comentar.");
    } finally {
      setBusy(false);
    }
  }

  if (tareas === null) {
    return <SkeletonFilas n={3} />;
  }

  const hechas = tareas.filter((t) => t.estado === "hecha").length;
  const total = tareas.length;
  const pct = total === 0 ? 0 : Math.round((hechas / total) * 100);

  return (
    <div className="space-y-4">
      <div>
        <div className="db-muted mb-1 flex justify-between text-xs">
          <span>
            {hechas}/{total} completadas
          </span>
          <span className="tabular-nums text-[#FFE600]">{pct}%</span>
        </div>
        <div className="db-progress-track h-2 overflow-hidden">
          <div
            className="db-progress-fill h-full"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error && <p className="db-error">{error}</p>}

      {total === 0 ? (
        <p className="db-muted text-sm">
          No hay tareas todavía. Se generarán al aprobar la sesión.
        </p>
      ) : (
        <ul className="space-y-2">
          {tareas.map((t) => {
            const subtareas = t.subtareas ?? [];
            const hechasSub = subtareas.filter((st) => st.hecha).length;
            const comentarios = t.comentarios ?? [];
            const hiloAbierto = Boolean(hilos[t.id]);
            const puedeComentar = Boolean(roles[t.rol]) || roles.admin === "titular";
            return (
              <li
                key={t.id}
                className={`rounded-xl border transition ${
                  esTitular ? "border-white/12 hover:border-[#FFE600]" : "border-white/12"
                } ${t.estado === "hecha" ? "bg-white/5" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(t)}
                  disabled={!esTitular || busy}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left text-sm disabled:cursor-default disabled:opacity-60"
                >
                  <span
                    className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-xs ${
                      t.estado === "hecha"
                        ? "border-[#FFE600] bg-[#FFE600] text-black"
                        : "border-white/40"
                    }`}
                  >
                    {t.estado === "hecha" ? "✓" : ""}
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    <span
                      className={
                        t.estado === "hecha" ? "line-through opacity-60" : ""
                      }
                    >
                      {t.titulo}
                    </span>
                    {todas && (
                      <span className="ml-2 rounded bg-[#FFE600]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#FFE600]">
                        {t.rol}
                      </span>
                    )}
                    {t.origen === "personal" && (
                      <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white/60">
                        personal
                      </span>
                    )}
                    {subtareas.length > 0 && (
                      <span className="ml-2 text-xs text-white/60 uppercase">
                        {hechasSub}/{subtareas.length} pasos
                      </span>
                    )}
                  </span>
                </button>

                {subtareas.length > 0 && (
                  <ul className="ml-12 mr-4 mb-1 space-y-0.5 border-l border-white/10 pl-3">
                    {subtareas.map((st) => (
                      <li key={st.id}>
                        <button
                          type="button"
                          onClick={() => onToggleSub(t, st.id)}
                          disabled={!esTitular || busy}
                          className={`flex min-h-9 w-full items-center gap-2 rounded px-1.5 py-1.5 text-left text-xs ${
                            esTitular ? "hover:bg-white/5" : "cursor-default"
                          }`}
                        >
                          <span
                            className={`flex size-3.5 shrink-0 items-center justify-center rounded-[3px] border text-[9px] ${
                              st.hecha
                                ? "border-[#FFE600] bg-[#FFE600] text-black"
                                : "border-white/30"
                            }`}
                          >
                            {st.hecha ? "✓" : ""}
                          </span>
                          <span
                            className={
                              st.hecha ? "line-through opacity-60" : "text-white/75"
                            }
                          >
                            {st.titulo}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {esTitular && (
                  <form
                    onSubmit={(e) => onAddSub(e, t)}
                    className="ml-12 mr-4 mb-3 flex gap-1.5"
                  >
                    <input
                      type="text"
                      value={nuevasSub[t.id] ?? ""}
                      onChange={(e) =>
                        setNuevasSub((prev) => ({ ...prev, [t.id]: e.target.value }))
                      }
                      maxLength={120}
                      placeholder="+ subtarea…"
                      className="db-input flex-1"
                    />
                    <button
                      type="submit"
                      disabled={busy || (nuevasSub[t.id] ?? "").trim().length < 3}
                      className="db-btn text-xs! px-2!"
                    >
                      Añadir
                    </button>
                  </form>
                )}

                <div className="ml-12 mr-4 mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      setHilos((prev) => ({ ...prev, [t.id]: !prev[t.id] }))
                    }
                    aria-expanded={hiloAbierto}
                    className="db-kicker text-xs underline"
                  >
                    💬 {comentarios.length} {hiloAbierto ? "· ocultar" : "· comentar"}
                  </button>

                  {hiloAbierto && (
                    <div className="mt-2 space-y-2">
                      {comentarios.length === 0 && (
                        <p className="db-muted text-xs">
                          Sin comentarios todavía. Escribe el primero.
                        </p>
                      )}
                      {comentarios.map((c) => (
                        <div
                          key={c.id}
                          className="rounded-lg bg-white/5 px-2.5 py-1.5 text-xs"
                        >
                          <span className="font-semibold">{c.autor}</span>{" "}
                          <span className="db-muted">
                            {fmtComentario(c.fecha)}
                          </span>
                          <p className="mt-0.5 break-words whitespace-pre-wrap">
                            {c.texto}
                          </p>
                        </div>
                      ))}
                      {puedeComentar && (
                        <form
                          onSubmit={(e) => onComentar(e, t)}
                          className="flex gap-1.5"
                        >
                          <input
                            type="text"
                            value={nuevosCom[t.id] ?? ""}
                            onChange={(e) =>
                              setNuevosCom((prev) => ({
                                ...prev,
                                [t.id]: e.target.value,
                              }))
                            }
                            maxLength={500}
                            placeholder="Comentar…"
                            aria-label={`Comentar en ${t.titulo}`}
                            className="db-input flex-1"
                          />
                          <button
                            type="submit"
                            disabled={busy || !(nuevosCom[t.id] ?? "").trim()}
                            className="db-btn text-xs! px-2!"
                          >
                            Enviar
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {esTitular ? (
        <form onSubmit={onAdd} className="flex gap-2">
          <input
            type="text"
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            maxLength={200}
            placeholder="Nueva tarea para este rol…"
            className="db-input flex-1"
          />
          <button
            type="submit"
            disabled={busy || nueva.trim().length < 3}
            className="db-btn"
          >
            Añadir
          </button>
        </form>
      ) : soloLectura ? (
        <p className="db-muted text-xs">
          Modo solo lectura: consulta las tareas de todos los roles, pero no
          las marques ni las edites.
        </p>
      ) : (
        <p className="db-muted text-xs">
          Modo solo lectura (rol de apoyo): puedes consultar las tareas, pero
          no marcarlas ni editarlas.
        </p>
      )}
    </div>
  );
}
