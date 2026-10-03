"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES_META } from "@/lib/constants";
import { ROLES } from "@/types";
import type { Rol } from "@/types";
import { TaskList } from "@/components/panel/task-list";
import { RotationPanel } from "@/components/admin/rotation-panel";
import { ApproveCard } from "@/components/panel/approve-card";
import { CashModule } from "@/components/panel/cash-module";

function PanelBody({ rol, tipo }: { rol: Rol; tipo: string }) {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800 sm:p-6">
        <h2 className="mb-4 text-base font-bold">Lista de tareas</h2>
        <TaskList rol={rol} />
      </section>

      {rol === "admin" && tipo === "titular" && (
        <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800 sm:p-6">
          <h2 className="mb-1 text-base font-bold">Rotación mensual de roles</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Asigna titulares y apoyos para el mes. Los cambios actualizan los
            permisos de cada usuario.
          </p>
          <RotationPanel />
        </section>
      )}

      {rol === "general" && (
        <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800 sm:p-6">
          <h2 className="mb-4 text-base font-bold">Aprobación de la sesión</h2>
          <ApproveCard puedeAprobar={tipo === "titular"} />
        </section>
      )}

      {(rol === "stage-manager" || rol === "grupo-base") && (
        <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800 sm:p-6">
          <h2 className="mb-1 text-base font-bold">Escaleta en directo</h2>
          <p className="mb-4 text-sm text-neutral-500">
            Orden de actuación operable desde el móvil durante la Jam.
          </p>
          <Link
            href="/panel/stage-manager/escaleta"
            className="inline-block rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black"
          >
            Abrir escaleta
          </Link>
        </section>
      )}

      {rol === "caja" && (
        <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800 sm:p-6">
          <h2 className="mb-4 text-base font-bold">Caja y Barra</h2>
          <CashModule puedeEscribir={tipo === "titular"} />
        </section>
      )}
    </div>
  );
}

export function RolPanelClient({ rol: rolParam }: { rol: string }) {
  const { roles, loading } = useAuth();
  const rol = rolParam as Rol;
  const valido = ROLES.includes(rol);
  const tipo = roles[rol];

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-neutral-500">Cargando…</p>
      </div>
    );
  }

  if (!valido) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-neutral-500">Rol no encontrado.</p>
        <Link href="/panel" className="mt-2 text-sm underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  if (!tipo) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-neutral-500">
          No tienes acceso al panel de {ROLES_META[rol].label}. Si crees que es
          un error, contacta con el administrador.
        </p>
        <Link href="/panel" className="mt-2 text-sm underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/panel" className="text-xs text-neutral-500 underline">
            ← Paneles
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{ROLES_META[rol].label}</h1>
          <p className="mt-1 text-sm text-neutral-500">
            {ROLES_META[rol].description}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            tipo === "titular"
              ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
              : "bg-neutral-100 text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400"
          }`}
        >
          {tipo}
        </span>
      </header>

      <PanelBody rol={rol} tipo={tipo} />
    </div>
  );
}
