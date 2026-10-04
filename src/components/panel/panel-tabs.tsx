"use client";

import { useState, type ReactNode } from "react";

export interface PanelTab {
  id: string;
  label: string;
  /** Contador de pendientes mostrado en el chip (0 o undefined = sin contador). */
  conteo?: number;
  /** Contenido de la pestaña; si es función recibe el salto a otra pestaña. */
  node: ReactNode | ((go: (id: string) => void) => ReactNode);
}

function idDesdeHash(tabs: PanelTab[]): string {
  if (typeof window === "undefined") return tabs[0]?.id ?? "";
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return tabs.some((t) => t.id === hash) ? hash : tabs[0]?.id ?? "";
}

/**
 * Navegación por secciones del panel: chips sticky con scroll horizontal,
 * deep-link por hash (#tareas, #caja…) y contador de pendientes. Solo se
 * renderiza la pestaña activa para evitar el scroll continuo de las
 * secciones apiladas.
 */
export function PanelTabs({
  tabs,
  onCambio,
}: {
  tabs: PanelTab[];
  /** Se dispara al cambiar de pestaña (p.ej. para refrescar contadores). */
  onCambio?: (id: string) => void;
}) {
  const [activo, setActivo] = useState(() => idDesdeHash(tabs));

  function seleccionar(id: string) {
    setActivo(id);
    window.history.replaceState(null, "", `#${id}`);
    onCambio?.(id);
  }

  const actual = tabs.find((t) => t.id === activo) ?? tabs[0];

  return (
    <div className="space-y-4">
      <nav
        aria-label="Secciones del panel"
        className="db-tabs db-scroll-x sticky top-16 z-30 -mx-4 flex gap-1.5 overflow-x-auto px-4 pt-3 pb-2.5"
      >
        {tabs.map((t) => {
          const activa = t.id === actual?.id;
          const tieneConteo = typeof t.conteo === "number" && t.conteo > 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => seleccionar(t.id)}
              aria-current={activa ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
                activa
                  ? "bg-[#FFE600] text-black"
                  : "border border-white/15 text-white/55 hover:border-[#FFE600]/50 hover:text-white"
              }`}
            >
              {t.label}
              {tieneConteo && (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                    activa
                      ? "bg-black/20 text-black"
                      : "bg-[#FFE600] text-black"
                  }`}
                >
                  {t.conteo}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div key={actual?.id} className="db-fade">
        {typeof actual?.node === "function"
          ? actual.node(seleccionar)
          : actual?.node}
      </div>
    </div>
  );
}
