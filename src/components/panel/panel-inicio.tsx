"use client";

import type { ReactNode } from "react";
import { diasPara, type PasoSiguiente } from "@/lib/panel/proximo-paso";
import type { EstadoPanel } from "@/components/panel/use-panel-status";
import type { Rol } from "@/types";

function Stat({ valor, label }: { valor: string; label: string }) {
  return (
    <div className="db-stat">
      <p className="db-stat-valor">{valor}</p>
      <p className="db-stat-label">{label}</p>
    </div>
  );
}

/**
 * Pestaña Inicio: resumen de lo que está pasando (estado en vivo) +
 * el siguiente paso recomendado. El paso a paso completo vive en el
 * modal «Protocolo».
 */
export function PanelInicio({
  rol,
  estado,
  paso,
  irA,
  onProtocolo,
  consultas,
}: {
  rol: Rol;
  estado: EstadoPanel;
  paso: PasoSiguiente;
  irA: (id: string) => void;
  onProtocolo: () => void;
  consultas?: ReactNode;
}) {
  const esAdmin = rol === "admin";
  const verCuadrantes = esAdmin || rol === "general" || rol === "grupo-base";
  const dias = estado.evento ? diasPara(estado.evento.fecha) : null;

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="db-card p-4 sm:p-6">
        <h2 className="db-title mb-1 text-base">Resumen</h2>
        <p className="db-muted mb-4 text-sm">
          {esAdmin
            ? "Todo el equipo en modo consulta: por aquí empieza tu revisión."
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
                  {dias !== null && estado.evento.estado !== "realizado" && (
                    <span className="db-badge db-badge-line">
                      {dias < 0
                        ? `Hace ${Math.abs(dias)} días`
                        : dias === 0
                          ? "¡Hoy!"
                          : `Faltan ${dias} días`}
                    </span>
                  )}
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

            {/* En admin las tarjetas KPI superiores ya muestran estos datos */}
            {!esAdmin && (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Stat
                  valor={`${estado.tareasHechas}/${estado.tareasTotal}`}
                  label="tareas hechas"
                />
                {verCuadrantes && (
                  <Stat
                    valor={String(estado.propuestasPendientes)}
                    label="propuestas pendientes"
                  />
                )}
                {verCuadrantes && (
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
            )}

            {consultas && <div className="flex flex-wrap gap-2">{consultas}</div>}
          </div>
        )}
      </section>

      <section className="db-card border-[#FFE600]/35 p-4 sm:p-6">
        <h2 className="db-title mb-1 text-base">Tu siguiente paso</h2>
        <p className="mb-4 text-sm text-white/85">{paso.texto}</p>
        <div className="flex flex-wrap gap-2">
          {paso.irA && (
            <button
              type="button"
              onClick={() => paso.irA && irA(paso.irA)}
              className="db-btn text-xs!"
            >
              Ir a la sección
            </button>
          )}
          <button
            type="button"
            onClick={onProtocolo}
            className="db-ghost text-xs!"
          >
            Ver protocolo completo
          </button>
        </div>
      </section>
    </div>
  );
}
