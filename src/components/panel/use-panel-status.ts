"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api/client";
import type { Evento, Inscripcion, Propuesta, ResumenCaja, Rol, Tarea } from "@/types";

export interface EstadoPanel {
  cargando: boolean;
  evento: Evento | null;
  tareasHechas: number;
  tareasTotal: number;
  propuestasPendientes: number;
  inscripcionesPendientes: number;
  /** null cuando el rol no tiene acceso de lectura a la caja. */
  cajaCerrada: boolean | null;
}

/** Roles con permiso de lectura de caja (cash.list). */
const PUEDE_LEER_CAJA: Rol[] = ["admin", "general", "caja"];

const ESTADO_INICIAL: EstadoPanel = {
  cargando: true,
  evento: null,
  tareasHechas: 0,
  tareasTotal: 0,
  propuestasPendientes: 0,
  inscripcionesPendientes: 0,
  cajaCerrada: null,
};

/**
 * Estado en vivo del panel: sesión, tareas del rol, propuestas e
 * inscripciones pendientes y cierre de caja (si el rol puede leerla).
 * Se usa en la pestaña Inicio y para los contadores de las pestañas.
 */
export function usePanelStatus(rol: Rol): EstadoPanel & { recargar: () => void } {
  const [estado, setEstado] = useState<EstadoPanel>(ESTADO_INICIAL);

  const recargar = useCallback(() => {
    const eventoP = api<{ evento: Evento | null }>("public.event")
      .then((res) => res.evento ?? null)
      .catch(() => null);

    const tareasP = api<{ tareas: Tarea[] }>("task.list")
      .then((res) => res.tareas ?? [])
      .catch(() => [] as Tarea[]);

    const propuestasP = api<{ propuestas: Propuesta[] }>("proposal.list")
      .then((res) => res.propuestas ?? [])
      .catch(() => [] as Propuesta[]);

    const inscripcionesP = api<{ inscripciones: Inscripcion[] }>("event.inscripciones")
      .then((res) => res.inscripciones ?? [])
      .catch(() => [] as Inscripcion[]);

    const cajaP = PUEDE_LEER_CAJA.includes(rol)
      ? api<ResumenCaja>("cash.list")
          .then((res) => res.cierre !== null)
          .catch(() => null)
      : Promise.resolve(null);

    void Promise.all([eventoP, tareasP, propuestasP, inscripcionesP, cajaP]).then(
      ([evento, tareas, propuestas, inscripciones, cajaCerrada]) => {
        const propias = rol === "admin" ? tareas : tareas.filter((t) => t.rol === rol);
        setEstado({
          cargando: false,
          evento,
          tareasHechas: propias.filter((t) => t.estado === "hecha").length,
          tareasTotal: propias.length,
          propuestasPendientes: propuestas.filter((p) => p.estado === "pendiente")
            .length,
          inscripcionesPendientes: inscripciones.filter(
            (i) => i.estado === "pendiente",
          ).length,
          cajaCerrada,
        });
      },
    );
  }, [rol]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { ...estado, recargar };
}
