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
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Paneles del equipo</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Acceso a los paneles de los roles asignados en la rotación actual.
        </p>
      </header>

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : asignados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 p-6 text-sm text-neutral-500 dark:border-neutral-700">
          No tienes roles de equipo asignados. Si crees que es un error,
          contacta con el administrador.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {asignados.map((rol) => (
            <li key={rol}>
              <Link
                href={`/panel/${rol}`}
                className="block h-full rounded-2xl border border-neutral-200 p-5 transition hover:border-neutral-400 dark:border-neutral-800"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-bold">{ROLES_META[rol].label}</h2>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      roles[rol] === "titular"
                        ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                        : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
                    }`}
                  >
                    {roles[rol]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-neutral-500">
                  {ROLES_META[rol].description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
