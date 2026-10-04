"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES_META } from "@/lib/constants";
import { ROLES } from "@/types";
import type { Rol } from "@/types";
import { TaskList } from "@/components/panel/task-list";
import { RotationPanel } from "@/components/admin/rotation-panel";
import { ApproveCard } from "@/components/panel/approve-card";
import { CashModule } from "@/components/panel/cash-module";
import { InscripcionesPanel } from "@/components/panel/inscripciones-panel";
import { InstrumentosPanel } from "@/components/panel/instrumentos-panel";
import { PropuestasPanel } from "@/components/panel/propuestas-panel";
import { DifusionKit } from "@/components/panel/difusion-kit";
import { RoleGuide } from "@/components/panel/role-guide";

function Seccion({
  titulo,
  nota,
  children,
}: {
  titulo: string;
  nota?: string;
  children: ReactNode;
}) {
  return (
    <section className="db-card p-5 sm:p-6">
      <h2 className="db-title mb-1 text-base">{titulo}</h2>
      {nota && <p className="db-muted mb-4 text-sm">{nota}</p>}
      <div className={nota ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

function PanelBody({ rol, tipo }: { rol: Rol; tipo: string }) {
  const esTitular = tipo === "titular";

  if (rol === "admin") {
    return (
      <div className="space-y-6">
        <RoleGuide rol="admin" />

        <Seccion
          titulo="Vista global · solo lectura"
          nota="Todo lo que ocurre en los demás paneles, aquí en modo consulta. Tu única edición posible es la rotación de roles."
        >
          <div className="flex flex-wrap gap-2">
            <span className="db-badge db-badge-solid">Estado</span>
            <span className="db-badge db-badge-line">Tareas</span>
            <span className="db-badge db-badge-line">Escaleta</span>
            <span className="db-badge db-badge-line">Inscripciones</span>
            <span className="db-badge db-badge-line">Propuestas</span>
            <span className="db-badge db-badge-line">Instrumentos</span>
            <span className="db-badge db-badge-line">Caja</span>
          </div>
        </Seccion>

        <Seccion
          titulo="Estado de la sesión"
          nota="Solo lectura: la aprobación corresponde al rol General."
        >
          <ApproveCard puedeAprobar={false} />
        </Seccion>

        <Seccion
          titulo="Tareas de todos los roles"
          nota="Progreso global del equipo, etiquetado por rol. Solo lectura."
        >
          <TaskList rol="admin" todas soloLectura />
        </Seccion>

        <Seccion
          titulo="Escaleta"
          nota="Consulta del orden de actuación. Edición exclusiva de Stage Manager y Grupo Base."
        >
          <Link href="/panel/stage-manager/escaleta" className="db-btn">
            Abrir escaleta (lectura)
          </Link>
        </Seccion>

        <Seccion
          titulo="Inscripciones de músicos"
          nota="Solicitudes recibidas. Los estados los asigna el Grupo Base."
        >
          <InscripcionesPanel editable={false} />
        </Seccion>

        <Seccion
          titulo="Propuestas de repertorio"
          nota="Pendientes y resueltas. Las resuelve el rol General."
        >
          <PropuestasPanel editable={false} />
        </Seccion>

        <Seccion
          titulo="Instrumentos confirmados"
          nota="Líneas por instrumento para planificación técnica."
        >
          <InstrumentosPanel />
        </Seccion>

        <Seccion
          titulo="Caja y fondos"
          nota="Movimientos, totales y cierre. Escritura exclusiva del rol Caja."
        >
          <CashModule puedeEscribir={false} />
        </Seccion>

        <Seccion
          titulo="Rotación mensual de roles"
          nota="Tu única edición: asigna titulares y apoyos del mes. Los cambios actualizan los permisos de cada usuario."
        >
          {esTitular ? (
            <RotationPanel />
          ) : (
            <p className="db-muted text-xs">
              Modo solo lectura (apoyo): consulta la matriz, pero no la
              modifiques.
            </p>
          )}
        </Seccion>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RoleGuide rol={rol} />

      <Seccion titulo="Lista de tareas">
        <TaskList rol={rol} />
      </Seccion>

      {rol === "general" && (
        <Seccion titulo="Aprobación de la sesión">
          <ApproveCard puedeAprobar={esTitular} />
        </Seccion>
      )}

      {rol === "general" && (
        <Seccion
          titulo="Propuestas de repertorio"
          nota="Valida las propuestas de los músicos: aprueba o rechaza cada una."
        >
          <PropuestasPanel editable={esTitular} />
        </Seccion>
      )}

      {rol === "general" && (
        <Seccion
          titulo="Auditoría de fondos"
          nota="Lectura de la caja del evento. Solo el rol Caja escribe y cierra."
        >
          <CashModule puedeEscribir={false} />
        </Seccion>
      )}

      {rol === "grupo-base" && (
        <Seccion
          titulo="Inscripciones de músicos"
          nota="Instrumentos y temas solicitados. Asigna el estado de cada inscripción."
        >
          <InscripcionesPanel editable={esTitular} />
        </Seccion>
      )}

      {(rol === "stage-manager" || rol === "grupo-base") && (
        <Seccion
          titulo="Escaleta en directo"
          nota="Orden de actuación operable desde el móvil durante la Jam."
        >
          <Link href="/panel/stage-manager/escaleta" className="db-btn">
            Abrir escaleta
          </Link>
        </Seccion>
      )}

      {rol === "tecnico" && (
        <Seccion
          titulo="Instrumentos confirmados"
          nota="Líneas confirmadas por inscripción: base para microfonías y monitores."
        >
          <InstrumentosPanel />
        </Seccion>
      )}

      {rol === "caja" && (
        <Seccion titulo="Caja y Barra">
          <CashModule puedeEscribir={esTitular} />
        </Seccion>
      )}

      {rol === "redes" && (
        <Seccion
          titulo="Kit de difusión"
          nota="Datos del evento y textos base para cartel y publicaciones."
        >
          <DifusionKit />
        </Seccion>
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
