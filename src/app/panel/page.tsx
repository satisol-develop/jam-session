"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES_META } from "@/lib/constants";
import { ROLES } from "@/types";
import type { Rol } from "@/types";
import { TabIcon } from "@/components/panel/panel-icons";

const ROL_ICONO: Record<Rol, string> = {
  admin: "rotacion",
  general: "sesion",
  "grupo-base": "grupo-base",
  "stage-manager": "escaleta",
  tecnico: "instrumentos",
  caja: "caja",
  redes: "difusion",
};

export default function PanelHubPage() {
  const { roles, loading } = useAuth();
  const asignados = ROLES.filter((r) => roles[r]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <p className="db-kicker mb-2">Debarock Kolektiboa</p>
        <h1 className="db-title text-4xl sm:text-5xl">Panel de control</h1>
        <p className="db-muted mt-2 text-sm">
          Acceso a los paneles de los roles asignados en la rotación actual.
        </p>
      </header>

      {loading ? (
        <p className="db-muted text-sm">Cargando…</p>
      ) : asignados.length === 0 ? (
        <div className="db-card p-6 text-sm db-muted">
          No tienes roles de equipo asignados. Si crees que es un error,
          contacta con el administrador.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {asignados.map((rol) => (
            <li key={rol}>
              <Link
                href={`/panel/${rol}`}
                className="db-card db-card-hover block h-full p-4 sm:p-6"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <span className="text-[#FFE600]">
                      <TabIcon id={ROL_ICONO[rol]} className="size-5" />
                    </span>
                    <h2 className="db-title truncate text-lg">
                      {ROLES_META[rol].label}
                    </h2>
                  </span>
                  <span
                    className={`db-badge shrink-0 ${
                      roles[rol] === "titular"
                        ? "db-badge-solid"
                        : "db-badge-line"
                    }`}
                  >
                    {roles[rol]}
                  </span>
                </div>
                <p className="db-muted mt-2 text-sm">
                  {ROLES_META[rol].description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="db-muted mt-8 text-xs">
        ¿Tarea del día? Entra en tu panel: el Inicio te dice el siguiente paso
        y el botón Protocolo resume el ciclo completo.
      </p>
    </div>
  );
}
