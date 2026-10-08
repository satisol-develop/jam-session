"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import type { Evento } from "@/types";

function fechaLegible(valor: string, conHora = false): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    ...(conHora
      ? { hour: "2-digit", minute: "2-digit" }
      : { year: "numeric" }),
  }).format(d);
}

export function ApproveCard({ puedeEditar }: { puedeEditar: boolean }) {
  const [evento, setEvento] = useState<Evento | null | undefined>(undefined);
  const [form, setForm] = useState({ titulo: "", fecha: "", hora: "", lugar: "" });
  const [crear, setCrear] = useState({
    mes: "",
    titulo: "",
    fecha: "",
    hora: "",
    lugar: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function aplicar(ev: Evento | null) {
    setEvento(ev);
    if (ev) {
      setForm({
        titulo: ev.titulo,
        fecha: ev.fecha,
        hora: ev.hora,
        lugar: ev.lugar,
      });
    }
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
        if (ev) {
          setForm({
            titulo: ev.titulo,
            fecha: ev.fecha,
            hora: ev.hora,
            lugar: ev.lugar,
          });
        }
      })
      .catch(() => setEvento(null));
  }, []);

  function set(campo: keyof typeof form, valor: string) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setOk(null);
  }

  async function guardarDatos(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("event.update", form);
      setOk("Datos de la sesión guardados.");
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  async function aprobar() {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      const res = await api<{ tareasGeneradas: number }>("general.approve", {});
      setOk(`Sesión aprobada. ${res.tareasGeneradas} tareas generadas para los roles.`);
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo aprobar.");
    } finally {
      setBusy(false);
    }
  }

  async function cerrarEvento() {
    if (
      !window.confirm(
        "¿Cerrar el evento? Se congelará la operativa, quedará archivado en el historial y podrás crear el siguiente.",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("event.close", {});
      setOk("Evento cerrado y archivado en el historial.");
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar.");
    } finally {
      setBusy(false);
    }
  }

  async function crearSiguiente(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("event.create", crear);
      setOk("Siguiente evento creado en borrador.");
      setCrear({ mes: "", titulo: "", fecha: "", hora: "", lugar: "" });
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear.");
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
            evento.estado !== "borrador" ? "db-badge-solid" : "db-badge-line"
          }`}
        >
          {evento.estado}
        </span>
        <span className="db-muted text-xs">
          {fechaLegible(evento.fecha)} · {evento.hora} · {evento.lugar}
        </span>
        {evento.inscripcionesCerradas && (
          <span className="db-badge db-badge-line">Inscripciones cerradas</span>
        )}
        {evento.ensayo && (
          <span className="db-muted text-xs">
            Ensayo general: {fechaLegible(evento.ensayo, true)}
          </span>
        )}
      </div>

      {evento.estado === "realizado" && (
        <p className="db-muted text-xs">
          Evento cerrado: operativa congelada y archivado en el historial del
          admin. Desde aquí puedes crear la siguiente sesión.
        </p>
      )}

      {puedeEditar && evento.estado !== "realizado" && (
        <form
          onSubmit={guardarDatos}
          className="grid gap-3 rounded-xl border border-neutral-200 p-4 dark:border-white/12 sm:grid-cols-2"
        >
          <label className="text-xs font-semibold">
            Título
            <input
              value={form.titulo}
              onChange={(e) => set("titulo", e.target.value)}
              maxLength={120}
              className="db-input mt-1 w-full"
            />
          </label>
          <label className="text-xs font-semibold">
            Lugar
            <input
              value={form.lugar}
              onChange={(e) => set("lugar", e.target.value)}
              maxLength={160}
              className="db-input mt-1 w-full"
            />
          </label>
          <label className="text-xs font-semibold">
            Fecha
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => set("fecha", e.target.value)}
              className="db-input mt-1 w-full"
            />
          </label>
          <label className="text-xs font-semibold">
            Hora
            <input
              type="time"
              value={form.hora}
              onChange={(e) => set("hora", e.target.value)}
              className="db-input mt-1 w-full"
            />
          </label>
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className="db-btn">
              {busy ? "Guardando…" : "Guardar datos de la sesión"}
            </button>
          </div>
        </form>
      )}

      {evento.estado === "borrador" &&
        (puedeEditar ? (
          <button onClick={aprobar} disabled={busy} className="db-btn">
            {busy ? "Aprobando…" : "Aprobar sesión y generar tareas"}
          </button>
        ) : (
          <p className="db-muted text-xs">
            Solo el titular del rol General puede aprobar la sesión.
          </p>
        ))}

      {evento.estado === "aprobado" &&
        (puedeEditar ? (
          <>
            <button onClick={cerrarEvento} disabled={busy} className="db-ghost">
              {busy ? "Cerrando…" : "Cerrar evento y enviar al historial"}
            </button>
            <p className="db-muted text-xs">
              Requiere que la caja esté cerrada por el rol Caja.
            </p>
          </>
        ) : (
          <p className="db-muted text-xs">
            El cierre del evento corresponde al titular del rol General.
          </p>
        ))}

      {evento.estado === "realizado" &&
        (puedeEditar ? (
          <form
            onSubmit={crearSiguiente}
            className="grid gap-3 rounded-xl border border-neutral-200 p-4 dark:border-white/12 sm:grid-cols-2"
          >
            <p className="db-kicker sm:col-span-2">
              Crear la siguiente sesión
            </p>
            <label className="text-xs font-semibold">
              Mes
              <input
                type="month"
                value={crear.mes}
                onChange={(e) =>
                  setCrear((prev) => ({ ...prev, mes: e.target.value }))
                }
                required
                className="db-input mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold">
              Título
              <input
                value={crear.titulo}
                onChange={(e) =>
                  setCrear((prev) => ({ ...prev, titulo: e.target.value }))
                }
                maxLength={120}
                required
                placeholder="Jam Session de Noviembre"
                className="db-input mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold">
              Fecha
              <input
                type="date"
                value={crear.fecha}
                onChange={(e) =>
                  setCrear((prev) => ({ ...prev, fecha: e.target.value }))
                }
                required
                className="db-input mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold">
              Hora
              <input
                type="time"
                value={crear.hora}
                onChange={(e) =>
                  setCrear((prev) => ({ ...prev, hora: e.target.value }))
                }
                className="db-input mt-1 w-full"
              />
            </label>
            <label className="text-xs font-semibold sm:col-span-2">
              Lugar
              <input
                value={crear.lugar}
                onChange={(e) =>
                  setCrear((prev) => ({ ...prev, lugar: e.target.value }))
                }
                maxLength={160}
                className="db-input mt-1 w-full"
              />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className="db-btn">
                {busy ? "Creando…" : "Crear evento siguiente (borrador)"}
              </button>
            </div>
          </form>
        ) : (
          <p className="db-muted text-xs">
            El siguiente evento lo crea el titular del rol General.
          </p>
        ))}

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
