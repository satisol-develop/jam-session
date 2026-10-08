"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES_META, ROL_ICONO } from "@/lib/constants";
import { ROLES } from "@/types";
import { TabIcon } from "@/components/panel/panel-icons";

/**
 * Acceso a los paneles desde la topbar:
 * - un solo rol sin más opciones → enlace directo a ese panel;
 * - el resto → hoja inferior con tus roles + la opción «Participante · Mi zona»
 *   (no-admin) para cambiar de «entorno» desde cualquier pantalla.
 */
export function RoleSwitcher({
  linkCls,
  linkActivo,
}: {
  linkCls: string;
  linkActivo: string;
}) {
  const { roles, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const asignados = ROLES.filter((r) => roles[r]);

  const enPanel = pathname.startsWith("/panel");
  const enMiZona = pathname === "/mi";
  const clase = `${linkCls} ${enPanel ? linkActivo : ""}`;

  /** Solo el admin es «puro equipo»: el resto puede pasar a participante. */
  const puedeParticipante = !roles.admin;

  /* La hoja bloquea el scroll de fondo y cierra con Escape. */
  useEffect(() => {
    if (!abierto) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [abierto]);

  if (loading || asignados.length === 0) return null;

  // Admin con un solo rol: no hay nada más que abrir, enlace directo.
  if (asignados.length === 1 && !puedeParticipante) {
    return (
      <Link href={`/panel/${asignados[0]}`} className={clase}>
        Panel
      </Link>
    );
  }

  function irA(href: string) {
    setAbierto(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        className={clase}
      >
        Panel ▾
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={() => setAbierto(false)}
            className="db-sheet-backdrop"
          />
          <div
            role="dialog"
            aria-label="Cambiar de panel"
            className="db-sheet"
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="db-kicker">Tus paneles</p>
              <button
                type="button"
                onClick={() => setAbierto(false)}
                className="min-h-10 rounded-lg px-3 py-2 text-xs font-bold text-white/60 uppercase"
              >
                Cerrar
              </button>
            </div>
            <ul className="grid gap-1">
              {asignados.map((rol) => {
                const activo = pathname.startsWith(`/panel/${rol}`);
                return (
                  <li key={rol}>
                    <button
                      type="button"
                      onClick={() => irA(`/panel/${rol}`)}
                      aria-current={activo ? "page" : undefined}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                        activo
                          ? "bg-[#FFE600] text-black"
                          : "text-white/80 hover:bg-white/5"
                      }`}
                    >
                      <TabIcon
                        id={ROL_ICONO[rol]}
                        className={`size-5 shrink-0 ${activo ? "text-black" : "text-[#FFE600]"}`}
                      />
                      <span className="min-w-0 flex-1 truncate">
                        {ROLES_META[rol].label}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black uppercase ${
                          activo
                            ? "bg-black/20 text-black"
                            : "border border-white/20 text-white/60"
                        }`}
                      >
                        {roles[rol]}
                      </span>
                    </button>
                  </li>
                );
              })}
              {puedeParticipante && (
                <li>
                  <button
                    type="button"
                    onClick={() => irA("/mi")}
                    aria-current={enMiZona ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                      enMiZona
                        ? "bg-[#FFE600] text-black"
                        : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <TabIcon
                      id="inscripciones"
                      className={`size-5 shrink-0 ${enMiZona ? "text-black" : "text-[#FFE600]"}`}
                    />
                    <span className="min-w-0 flex-1 truncate">
                      Participante
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-black uppercase ${
                        enMiZona
                          ? "bg-black/20 text-black"
                          : "border border-white/20 text-white/60"
                      }`}
                    >
                      Mi zona
                    </span>
                  </button>
                </li>
              )}
              <li className="mt-1 border-t border-white/10 pt-1">
                <Link
                  href="/panel"
                  onClick={() => setAbierto(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-semibold text-white/50 transition hover:bg-white/5 hover:text-white/80"
                >
                  Panel de control (todos)
                </Link>
              </li>
            </ul>
          </div>
        </>
      )}
    </>
  );
}
