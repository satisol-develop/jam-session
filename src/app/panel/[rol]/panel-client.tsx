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
      <section className="db-card p-5 sm:p-6">
        <h2 className="db-title mb-4 text-base">Lista de tareas</h2>
        <TaskList rol={rol} />
      </section>

      {rol === "admin" && tipo === "titular" && (
        <section className="db-card p-5 sm:p-6">
          <h2 className="db-title mb-1 text-base">Rotación mensual de roles</h2>
          <p className="db-muted mb-4 text-sm">
            Asigna titulares y apoyos para el mes. Los cambios actualizan los
            permisos de cada usuario.
          </p>
          <RotationPanel />
        </section>
      )}

      {rol === "general" && (
        <section className="db-card p-5 sm:p-6">
          <h2 className="db-title mb-4 text-base">Aprobación de la sesión</h2>
          <ApproveCard puedeAprobar={tipo === "titular"} />
        </section>
      )}

      {(rol === "stage-manager" || rol === "grupo-base") && (
        <section className="db-card p-5 sm:p-6">
          <h2 className="db-title mb-1 text-base">Escaleta en directo</h2>
          <p className="db-muted mb-4 text-sm">
            Orden de actuación operable desde el móvil durante la Jam.
          </p>
          <Link href="/panel/stage-manager/escaleta" className="db-btn">
            Abrir escaleta
          </Link>
        </section>
      )}

      {rol === "caja" && (
        <section className="db-card p-5 sm:p-6">
          <h2 className="db-title mb-4 text-base">Caja y Barra</h2>
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
        <p className="db-muted text-sm">Cargando…</p>
      </div>
    );
  }

  if (!valido) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="db-muted text-sm">Rol no encontrado.</p>
        <Link href="/panel" className="mt-2 text-sm text-[#FFE600] underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  if (!tipo) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="db-muted text-sm">
          No tienes acceso al panel de {ROLES_META[rol].label}. Si crees que es
          un error, contacta con el administrador.
        </p>
        <Link href="/panel" className="mt-2 text-sm text-[#FFE600] underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/panel" className="db-kicker underline">
            ← Paneles
          </Link>
          <p className="db-kicker mt-2">Debarock Kolektiboa</p>
          <h1 className="db-title mt-1 text-3xl sm:text-4xl">
            {ROLES_META[rol].label}
          </h1>
          <p className="db-muted mt-1 text-sm">
            {ROLES_META[rol].description}
          </p>
        </div>
        <span
          className={`db-badge ${
            tipo === "titular" ? "db-badge-solid" : "db-badge-line"
          }`}
        >
          {tipo}
        </span>
      </header>

      <PanelBody rol={rol} tipo={tipo} />
    </div>
  );
}
