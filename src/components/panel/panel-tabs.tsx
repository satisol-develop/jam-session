"use client";

import { useState, type ReactNode } from "react";
import { TabIcon } from "@/components/panel/panel-icons";

export interface PanelTab {
  id: string;
  label: string;
  /** Contador de pendientes mostrado en la navegación (0 o undefined = sin contador). */
  conteo?: number;
  /** Entra en la bottom bar móvil (máx. 4; el resto va a la hoja «Más»). */
  primaria?: boolean;
  /** Contenido de la pestaña; si es función recibe el salto a otra pestaña. */
  node: ReactNode | ((go: (id: string) => void) => ReactNode);
}

function idDesdeHash(tabs: PanelTab[]): string {
  if (typeof window === "undefined") return tabs[0]?.id ?? "";
  const hash = decodeURIComponent(window.location.hash.slice(1));
  return tabs.some((t) => t.id === hash) ? hash : tabs[0]?.id ?? "";
}

function Conteo({ n, activa }: { n: number; activa?: boolean }) {
  return (
    <span
      className={`rounded-full px-1.5 text-[10px] font-black tabular-nums ${
        activa ? "bg-black/20 text-black" : "bg-[#FFE600] text-black"
      }`}
    >
      {n}
    </span>
  );
}

/**
 * Navegación del panel: bottom bar fija con iconos en móvil (zona del
 * pulgar + hoja «Más») y chips sticky en escritorio. Deep-link por hash
 * (#tareas, #caja…) y contadores de pendientes. Solo se renderiza la
 * pestaña activa.
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
  const [masAbierto, setMasAbierto] = useState(false);

  function seleccionar(id: string) {
    setActivo(id);
    setMasAbierto(false);
    window.history.replaceState(null, "", `#${id}`);
    onCambio?.(id);
  }

  const actual = tabs.find((t) => t.id === activo) ?? tabs[0];
  const primarias = tabs.filter((t) => t.primaria);
  const secundarias = tabs.filter((t) => !t.primaria);

  return (
    <div className="space-y-3 pb-24 sm:space-y-4 sm:pb-0">
      {/* Chips (desktop) */}
      <nav
        aria-label="Secciones del panel"
        className="db-tabs db-scroll-x sticky top-16 z-30 -mx-4 hidden gap-1.5 overflow-x-auto px-4 pt-3 pb-2.5 sm:flex"
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
              <TabIcon id={t.id} className="size-3.5" />
              {t.label}
              {tieneConteo && <Conteo n={t.conteo as number} activa={activa} />}
            </button>
          );
        })}
      </nav>

      {/* Contenido de la pestaña activa */}
      <div key={actual?.id} className="db-fade">
        {typeof actual?.node === "function"
          ? actual.node(seleccionar)
          : actual?.node}
      </div>

      {/* Bottom bar (móvil) */}
      <nav
        aria-label="Secciones del panel"
        className="db-bottombar fixed inset-x-0 bottom-0 z-40 flex sm:hidden"
      >
        {primarias.map((t) => {
          const activa = t.id === actual?.id;
          const tieneConteo = typeof t.conteo === "number" && t.conteo > 0;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => seleccionar(t.id)}
              aria-current={activa ? "page" : undefined}
              className="db-bottombar-item"
            >
              <span className="relative">
                <TabIcon id={t.id} className="size-5" />
                {tieneConteo && !activa && (
                  <span className="absolute -top-1.5 -right-2 rounded-full bg-[#FFE600] px-1 text-[9px] leading-4 font-black text-black tabular-nums">
                    {t.conteo}
                  </span>
                )}
              </span>
              <span className="db-bottombar-label">{t.label}</span>
            </button>
          );
        })}
        {secundarias.length > 0 && (
          <button
            type="button"
            onClick={() => setMasAbierto(true)}
            aria-expanded={masAbierto}
            className="db-bottombar-item"
          >
            <TabIcon id="mas" className="size-5" />
            <span className="db-bottombar-label">Más</span>
          </button>
        )}
      </nav>

      {/* Hoja «Más» (móvil) */}
      {masAbierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setMasAbierto(false)}
            className="db-sheet-backdrop sm:hidden"
          />
          <div
            role="dialog"
            aria-label="Más secciones"
            className="db-sheet sm:hidden"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="db-kicker">Más secciones</p>
              <button
                type="button"
                onClick={() => setMasAbierto(false)}
                className="db-muted text-xs font-semibold uppercase"
              >
                Cerrar
              </button>
            </div>
            <ul className="grid gap-1">
              {secundarias.map((t) => {
                const activa = t.id === actual?.id;
                const tieneConteo =
                  typeof t.conteo === "number" && t.conteo > 0;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => seleccionar(t.id)}
                      aria-current={activa ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                        activa
                          ? "bg-[#FFE600] text-black"
                          : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <TabIcon id={t.id} className="size-5 shrink-0" />
                      <span className="flex-1">{t.label}</span>
                      {tieneConteo && (
                        <Conteo n={t.conteo as number} activa={activa} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
