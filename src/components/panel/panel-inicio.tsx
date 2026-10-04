"use client";

import type { ReactNode } from "react";
import { ROLES_META, ROLE_GUIDES } from "@/lib/constants";
import type { Rol } from "@/types";
import type { EstadoPanel } from "@/components/panel/use-panel-status";

function Stat({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="db-stat">
      <p className="db-stat-valor">{valor}</p>
      <p className="db-stat-label">{label}</p>
    </div>
  );
}

/**
 * Pestaña Inicio de cada panel: estado en vivo (qué hay que revisar ahora)
 * + protocolo paso a paso con salto a la pestaña correspondiente.
 */
export function PanelInicio({
  rol,
  estado,
  irA,
  consultas,
}: {
  rol: Rol;
  estado: EstadoPanel;
  irA: (id: string) => void;
  consultas?: ReactNode;
}) {
  const pasos = ROLE_GUIDES[rol];
  const esAdmin = rol === "admin";
  const verPropuestas = esAdmin || rol === "general" || rol === "grupo-base";
  const verInscripciones = verPropuestas;

  return (
    <div className="space-y-4">
      <section className="db-card p-5 sm:p-6">
        <h2 className="db-title mb-1 text-base">Estado ahora</h2>
        <p className="db-muted mb-4 text-sm">
          {esAdmin
            ? "Resumen de solo lectura de todo el equipo: por aquí empieza tu revisión."
            : "Lo que hay ahora mismo en tu panel."}
        </p>

        {estado.cargando ? (
          <p className="db-muted text-sm">Cargando estado…</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-semibold">
                {estado.evento?.titulo || "Sin sesión activa"}
              </span>
              {estado.evento && (
                <>
                  <span
                    className={`db-badge ${
                      estado.evento.estado !== "borrador"
                        ? "db-badge-solid"
                        : "db-badge-line"
                    }`}
                  >
                    {estado.evento.estado}
                  </span>
                  <span className="db-muted text-xs">
                    {estado.evento.fecha} · {estado.evento.hora} ·{" "}
                    {estado.evento.lugar}
                  </span>
                  {estado.evento.ensayo && (
                    <span className="db-muted text-xs">
                      Ensayo: {estado.evento.ensayo}
                    </span>
                  )}
                  {estado.evento.inscripcionesCerradas && (
                    <span className="db-badge db-badge-line">
                      Inscripciones cerradas
                    </span>
                  )}
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat
                valor={`${estado.tareasHechas}/${estado.tareasTotal}`}
                label={esAdmin ? "tareas del equipo" : "tareas hechas"}
              />
              {verPropuestas && (
                <Stat
                  valor={String(estado.propuestasPendientes)}
                  label="propuestas pendientes"
                />
              )}
              {verInscripciones && (
                <Stat
                  valor={String(estado.inscripcionesPendientes)}
                  label="inscripciones sin estado"
                />
              )}
              {estado.cajaCerrada !== null && (
                <Stat
                  valor={estado.cajaCerrada ? "Cerrada" : "Abierta"}
                  label="caja"
                />
              )}
            </div>

            {consultas && <div className="flex flex-wrap gap-2">{consultas}</div>}
          </div>
        )}
      </section>

      <section className="db-guide db-card p-5 sm:p-6">
        <h2 className="db-title mb-1 text-base">
          {esAdmin ? "Protocolo de revisión" : "Paso a paso"} ·{" "}
          {ROLES_META[rol].label}
        </h2>
        <p className="db-muted mb-4 text-sm">
          {esAdmin
            ? "Repasa el panel en este orden: cada paso salta a su sección."
            : "Trabaja en este orden: cada paso salta a su sección del panel."}
        </p>
        <ol className="db-pasos">
          {pasos.map((paso, i) => (
            <li key={`${i}-${paso.texto}`}>
              <span>{paso.texto}</span>
              {paso.irA && (
                <button
                  type="button"
                  onClick={() => irA(paso.irA as string)}
                  className="db-paso-ir"
                >
                  Ir →
                </button>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
