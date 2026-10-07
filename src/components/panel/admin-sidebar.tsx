"use client";

import { TabIcon } from "@/components/panel/panel-icons";
import type { PanelTab } from "@/components/panel/panel-tabs";

/**
 * Navegación lateral del panel de administración (estilo plantilla admin:
 * sidebar fijo en escritorio con secciones, contadores y atajo de
 * Protocolo). En tablet/móvil la navegación la aporta PanelTabs (chips +
 * bottom bar).
 */
export function AdminSidebar({
  tabs,
  activo,
  onSeleccionar,
  onProtocolo,
}: {
  tabs: PanelTab[];
  activo: string;
  onSeleccionar: (id: string) => void;
  onProtocolo: () => void;
}) {
  return (
    <aside className="hidden shrink-0 md:block md:w-56 lg:w-60">
      <nav
        aria-label="Secciones del panel de administración"
        className="db-card sticky top-[calc(4rem+env(safe-area-inset-top))] p-2"
      >
        <p className="db-kicker px-3 pt-2 pb-1.5">Administración</p>
        <ul className="grid gap-0.5">
          {tabs.map((t) => {
            const activa = t.id === activo;
            const tieneConteo = typeof t.conteo === "number" && t.conteo > 0;
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onSeleccionar(t.id)}
                  aria-current={activa ? "page" : undefined}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${
                    activa
                      ? "bg-[#FFE600] text-black"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <TabIcon id={t.id} className="size-4 shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{t.label}</span>
                  {tieneConteo && (
                    <span
                      className={`rounded-full px-1.5 text-[10px] font-black tabular-nums ${
                        activa ? "bg-black/20 text-black" : "bg-[#FFE600] text-black"
                      }`}
                    >
                      {t.conteo}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="mt-1 border-t border-white/10 pt-1">
          <button
            type="button"
            onClick={onProtocolo}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-bold text-white/70 transition hover:bg-white/5 hover:text-white"
          >
            <TabIcon id="protocolo" className="size-4 shrink-0" />
            Protocolo
          </button>
        </div>
      </nav>
    </aside>
  );
}
