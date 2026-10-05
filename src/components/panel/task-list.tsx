"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import type { Rol, Tarea } from "@/types";

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

  if (tareas === null) {
    return <p className="db-muted text-sm">Cargando tareas…</p>;
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
            return (
              <li
                key={t.id}
                className={`rounded-xl border transition ${
                  esTitular ? "border-white/15 hover:border-[#FFE600]" : "border-white/15"
                } ${t.estado === "hecha" ? "bg-white/5" : ""}`}
              >
                <button
                  type="button"
                  onClick={() => onToggle(t)}
                  disabled={!esTitular || busy}
                  className="flex w-full items-start gap-3 px-4 pt-3 text-left text-sm"
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
                  <span className="flex-1">
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
                      <span className="ml-2 text-[10px] uppercase text-white/45">
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
                          className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs ${
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
