"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import type { Rol, Tarea } from "@/types";

interface Props {
  rol: Rol;
}

export function TaskList({ rol }: Props) {
  const { roles } = useAuth();
  const esTitular = roles[rol] === "titular";
  const [tareas, setTareas] = useState<Tarea[] | null>(null);
  const [nueva, setNueva] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ tareas: Tarea[] }>("task.list")
      .then((res) => setTareas(res.tareas.filter((t) => t.rol === rol)))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setTareas([]);
      });
  }, [rol]);

  async function onToggle(tarea: Tarea) {
    if (!esTitular || busy) return;
    setBusy(true);
    setError(null);
    try {
      const actualizada = await api<Tarea>("task.toggle", { taskId: tarea.id });
      setTareas((prev) =>
        (prev ?? []).map((t) => (t.id === actualizada.id ? actualizada : t)),
      );
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

  if (tareas === null) {
    return <p className="text-sm text-neutral-500">Cargando tareas…</p>;
  }

  const hechas = tareas.filter((t) => t.estado === "hecha").length;
  const total = tareas.length;
  const pct = total === 0 ? 0 : Math.round((hechas / total) * 100);

  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 flex justify-between text-xs text-neutral-500">
          <span>
            {hechas}/{total} completadas
          </span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-green-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {total === 0 ? (
        <p className="text-sm text-neutral-500">
          No hay tareas todavía. Se generarán al aprobar la sesión.
        </p>
      ) : (
        <ul className="space-y-2">
          {tareas.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onToggle(t)}
                disabled={!esTitular || busy}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  esTitular
                    ? "border-neutral-200 hover:border-neutral-400 dark:border-neutral-800"
                    : "border-neutral-200 opacity-80 dark:border-neutral-800"
                } ${t.estado === "hecha" ? "bg-neutral-50 dark:bg-neutral-900/50" : ""}`}
              >
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border text-xs ${
                    t.estado === "hecha"
                      ? "border-green-600 bg-green-600 text-white"
                      : "border-neutral-400"
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
                  {t.origen === "personal" && (
                    <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-neutral-500 dark:bg-neutral-900">
                      personal
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
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
            className="flex-1 rounded-xl border border-neutral-300 bg-white px-3 py-2.5 text-sm text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <button
            type="submit"
            disabled={busy || nueva.trim().length < 3}
            className="rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
          >
            Añadir
          </button>
        </form>
      ) : (
        <p className="text-xs text-neutral-500">
          Modo solo lectura (rol de apoyo): puedes consultar las tareas, pero
          no marcarlas ni editarlas.
        </p>
      )}
    </div>
  );
}
