"use client";

import { useState, type ReactNode } from "react";

export interface PanelTab {
  id: string;
  label: string;
  node: ReactNode;
}

function idDesdeHash(tabs: PanelTab[]): string {
  if (typeof window === "undefined") return tabs[0]?.id ?? "";
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return tabs.some((t) => t.id === hash) ? hash : tabs[0]?.id ?? "";
}

/**
 * Navegación por secciones del panel: chips sticky con scroll horizontal y
 * deep-link por hash (#tareas, #caja…). Solo se renderiza la pestaña activa
 * para evitar el scroll continuo de las secciones apiladas.
 */
export function PanelTabs({ tabs }: { tabs: PanelTab[] }) {
  const [activo, setActivo] = useState(() => idDesdeHash(tabs));

  function seleccionar(id: string) {
    setActivo(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  const actual = tabs.find((t) => t.id === activo) ?? tabs[0];

  return (
    <div className="space-y-4">
      <nav
        aria-label="Secciones del panel"
        className="db-tabs db-scroll-x sticky top-16 z-30 -mx-4 flex gap-1.5 overflow-x-auto px-4 pt-3 pb-2.5"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => seleccionar(t.id)}
            aria-current={t.id === actual?.id ? "page" : undefined}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition ${
              t.id === actual?.id
                ? "bg-[#FFE600] text-black"
                : "border border-white/15 text-white/55 hover:border-[#FFE600]/50 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div key={actual?.id} className="db-fade">
        {actual?.node}
      </div>
    </div>
  );
}
