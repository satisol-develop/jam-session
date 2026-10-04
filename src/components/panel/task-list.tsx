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
          {tareas.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => onToggle(t)}
                disabled={!esTitular || busy}
                className={`flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  esTitular
                    ? "border-white/15 hover:border-[#FFE600]"
                    : "border-white/15"
                } ${t.estado === "hecha" ? "bg-white/5" : ""}`}
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
                    className={t.estado === "hecha" ? "line-through opacity-60" : ""}
                  >
                    {t.titulo}
                  </span>
                  {t.origen === "personal" && (
                    <span className="ml-2 rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white/60">
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
      ) : (
        <p className="db-muted text-xs">
          Modo solo lectura (rol de apoyo): puedes consultar las tareas, pero
          no marcarlas ni editarlas.
        </p>
      )}
    </div>
  );
}
