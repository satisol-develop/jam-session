"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type {
  CierreCaja,
  Evento,
  Inscripcion,
  MovimientoCaja,
  Rol,
  Tarea,
} from "@/types";

interface RolHistorial {
  rol: Rol;
  uid: string;
  tipo: string;
  nombre: string;
}

interface Entrada {
  evento: Evento;
  roles: RolHistorial[];
  inscripciones: Inscripcion[];
  tareas: Tarea[];
  movimientos: MovimientoCaja[];
  cierre: CierreCaja | null;
}

const fmtFecha = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function fechaLegible(valor: string): string {
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : fmtFecha.format(d);
}

function totales(movimientos: MovimientoCaja[]) {
  const t = { consumibles: 0, otros: 0, gastos: 0, beneficio: 0 };
  for (const m of movimientos) {
    if (m.tipo === "consumible") t.consumibles += m.importe;
    else if (m.tipo === "gasto") t.gastos += m.importe;
    else t.otros += m.importe;
  }
  t.beneficio = t.consumibles + t.otros - t.gastos;
  return t;
}

const eur = (n: number) =>
  n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });

function Stat({ label, value, extra }: { label: string; value: string; extra?: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-white/12">
      <dt className="db-kicker mb-1">{label}</dt>
      <dd className="text-sm font-bold">{value}</dd>
      {extra && <dd className="db-muted text-xs">{extra}</dd>}
    </div>
  );
}

function Resumen({ entrada }: { entrada: Entrada }) {
  const { evento, roles, inscripciones, tareas, movimientos, cierre } = entrada;
  const t = totales(movimientos);
  const hechas = tareas.filter((x) => x.estado === "hecha").length;
  const extras = tareas.filter((x) => x.origen === "personal").length;
  const asignados = inscripciones.filter((i) => i.estado === "asignado").length;
  const pendientes = tareas.filter((x) => x.estado === "pendiente");

  return (
    <article className="db-card space-y-4 p-4 sm:p-6">
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <h3 className="db-title text-base">{evento.titulo}</h3>
        <span className="db-badge db-badge-solid">realizado</span>
        <span className="db-muted text-xs">
          {fechaLegible(evento.fecha)} · {evento.hora} · {evento.lugar}
          {evento.ensayo && ` · ensayo ${fechaLegible(evento.ensayo)}`}
        </span>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Participantes"
          value={`${asignados} asignados`}
          extra={`${inscripciones.length} inscripciones`}
        />
        <Stat
          label="Tareas"
          value={`${hechas}/${tareas.length} hechas`}
          extra={extras > 0 ? `${extras} extra personal` : "sin extras"}
        />
        <Stat label="Beneficio" value={eur(t.beneficio)} extra="ingresos − gastos" />
        <Stat
          label="Cuadre de caja"
          value={cierre ? eur(cierre.diferencia) : "—"}
          extra={cierre ? "diferencia sobre lo esperado" : "sin cierre"}
        />
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <section>
          <h4 className="db-kicker mb-2">Roles del mes</h4>
          <ul className="space-y-1 text-sm">
            {roles.map((r, i) => (
              <li key={`${r.rol}-${r.uid}-${i}`} className="flex gap-2">
                <span className="font-medium">{r.rol}</span>
                <span className="db-muted">
                  {r.nombre}
                  {r.tipo === "apoyo" && " · apoyo"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h4 className="db-kicker mb-2">Caja</h4>
          <ul className="space-y-1 text-sm">
            <li>Consumos: {eur(t.consumibles)}</li>
            <li>Otros ingresos: {eur(t.otros)}</li>
            <li>Gastos: {eur(t.gastos)}</li>
            <li className="font-semibold">Beneficio: {eur(t.beneficio)}</li>
            {cierre && (
              <li className="db-muted text-xs">
                Fondo {eur(cierre.fondoInicial)} · contado{" "}
                {eur(cierre.efectivoContado)} · esperado{" "}
                {eur(cierre.esperadoEnCaja)}
              </li>
            )}
          </ul>
        </section>
      </div>

      <section>
        <h4 className="db-kicker mb-2">Movimientos ({movimientos.length})</h4>
        <ul className="divide-y divide-neutral-200 rounded-xl border border-neutral-200 text-sm dark:divide-white/10 dark:border-white/12">
          {movimientos.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <span className="min-w-0 break-words">
                {m.concepto}
                <span className="db-muted text-xs"> · {m.tipo}</span>
              </span>
              <span className="shrink-0 tabular-nums">{eur(m.importe)}</span>
            </li>
          ))}
        </ul>
      </section>

      {pendientes.length > 0 && (
        <section>
          <h4 className="db-kicker mb-2">
            Tareas sin completar ({pendientes.length})
          </h4>
          <ul className="space-y-1 text-sm">
            {pendientes.map((x) => (
              <li key={x.id} className="db-muted">
                {x.titulo}
                <span className="text-xs"> · {x.rol}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

export function HistoryReport() {
  const [historial, setHistorial] = useState<Entrada[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ historial: Entrada[] }>("admin.history")
      .then((d) => setHistorial(d.historial ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setHistorial([]);
      });
  }, []);

  if (error) return <p className="db-error">{error}</p>;
  if (historial === null) return <p className="db-muted text-sm">Cargando historial…</p>;
  if (historial.length === 0) {
    return (
      <p className="db-muted text-sm">
        Aún no hay sesiones cerradas: el historial aparece cuando el General
        cierra un evento.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {historial.map((e) => (
        <Resumen key={e.evento.id} entrada={e} />
      ))}
    </div>
  );
}
