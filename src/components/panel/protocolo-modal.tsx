"use client";

import { useEffect, useRef } from "react";
import { FASES, ROLES_META, ROLE_GUIDES, ROLE_NOTAS } from "@/lib/constants";
import type { Rol } from "@/types";

/**
 * Modal «Protocolo»: pasos de cada rol agrupados por fases del ciclo de
 * la sesión (Preparación → Semana de la Jam → Día de la Jam → Cierre).
 * Cada paso puede saltar a su pestaña y cerrar el modal.
 */
export function ProtocoloModal({
  rol,
  onCerrar,
  irA,
}: {
  rol: Rol;
  onCerrar: () => void;
  irA: (id: string) => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCerrar]);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const pasos = ROLE_GUIDES[rol];
  const nota = ROLE_NOTAS[rol];

  return (
    <>
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onCerrar}
        className="db-modal-backdrop"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Protocolo de ${ROLES_META[rol].label}`}
        className="db-modal"
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="db-kicker">Protocolo</p>
            <h2 className="db-title mt-0.5 text-lg">
              {ROLES_META[rol].label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="db-ghost min-h-10 shrink-0 px-3 py-2 text-xs!"
          >
            Cerrar
          </button>
        </div>

        <p className="db-muted mb-4 text-sm">
          El ciclo de la sesión en cuatro fases: sigue el orden y ve marcando
          cada paso en tus tareas.
        </p>

        <div className="space-y-5">
          {FASES.map((fase) => {
            const steps = pasos.filter((p) => p.fase === fase.id);
            if (steps.length === 0) return null;
            return (
              <section key={fase.id}>
                <div className="mb-2 flex flex-wrap items-baseline gap-x-2">
                  <h3 className="db-kicker">{fase.label}</h3>
                  <span className="db-muted text-xs">{fase.desc}</span>
                </div>
                <ol className="db-pasos">
                  {steps.map((paso, i) => (
                    <li key={`${fase.id}-${i}-${paso.texto}`}>
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
            );
          })}
        </div>

        {nota && (
          <p className="db-muted mt-5 border-t border-white/10 pt-3 text-xs">
            {nota}
          </p>
        )}
      </div>
    </>
  );
}
