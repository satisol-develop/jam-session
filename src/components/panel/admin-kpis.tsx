"use client";

import type { EstadoPanel } from "@/components/panel/use-panel-status";

function Kpi({
  valor,
  label,
  nota,
  destacado,
}: {
  valor: string;
  label: string;
  nota: string;
  destacado?: boolean;
}) {
  return (
    <div className="db-card border-l-4 border-l-[#FFE600] p-3 sm:p-4">
      <p
        className={`text-2xl font-black tabular-nums sm:text-3xl ${
          destacado ? "text-[#FFE600]" : "text-white"
        }`}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-xs font-bold text-white/85">{label}</p>
      <p className="db-muted text-[11px]">{nota}</p>
    </div>
  );
}

/**
 * Tarjetas KPI del panel de administración (cabecera del «dashboard»):
 * pendientes de todo el equipo, siempre visibles sobre el contenido.
 */
export function AdminKpis({ estado }: { estado: EstadoPanel }) {
  const caja =
    estado.cajaCerrada === null
      ? "—"
      : estado.cajaCerrada
        ? "Cerrada"
        : "Abierta";
  const pend = estado.cargando ? "—" : undefined;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Kpi
        valor={pend ?? String(estado.inscripcionesPendientes)}
        label="Inscripciones"
        nota="sin estado"
        destacado={!estado.cargando && estado.inscripcionesPendientes > 0}
      />
      <Kpi
        valor={pend ?? String(estado.propuestasPendientes)}
        label="Propuestas"
        nota="pendientes"
        destacado={!estado.cargando && estado.propuestasPendientes > 0}
      />
      <Kpi
        valor={
          pend ?? `${estado.tareasHechas}/${estado.tareasTotal}`
        }
        label="Tareas"
        nota="del equipo"
      />
      <Kpi
        valor={estado.cargando ? "—" : caja}
        label="Caja"
        nota={
          estado.cajaCerrada === null ? "sin acceso" : "cuadre del evento"
        }
      />
    </div>
  );
}
