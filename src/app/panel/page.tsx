"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES_META } from "@/lib/constants";
import { ROLES } from "@/types";

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
                className="db-card db-card-hover block h-full p-5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h2 className="db-title text-lg">{ROLES_META[rol].label}</h2>
                  <span
                    className={`db-badge ${
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
        ¿Tarea del día? Entra en tu panel: cada rol incluye su guía de proceso
        paso a paso.
      </p>
    </div>
  );
}
