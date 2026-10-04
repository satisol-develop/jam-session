"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES_META } from "@/lib/constants";
import { ROLES } from "@/types";
import type { Rol } from "@/types";
import { TaskList } from "@/components/panel/task-list";
import { ApoyosPanel } from "@/components/panel/apoyos-panel";
import { RotationPanel } from "@/components/admin/rotation-panel";
import { HistoryReport } from "@/components/admin/history-report";
import { ApproveCard } from "@/components/panel/approve-card";
import { CashModule } from "@/components/panel/cash-module";
import { InscripcionesPanel } from "@/components/panel/inscripciones-panel";
import { InstrumentosPanel } from "@/components/panel/instrumentos-panel";
import { PropuestasPanel } from "@/components/panel/propuestas-panel";
import { DifusionKit } from "@/components/panel/difusion-kit";
import { EnsayoPanel } from "@/components/panel/ensayo-panel";
import { GrupoBasePanel } from "@/components/panel/grupo-base-panel";
import { PanelInicio } from "@/components/panel/panel-inicio";
import { usePanelStatus } from "@/components/panel/use-panel-status";
import { PanelTabs, type PanelTab } from "@/components/panel/panel-tabs";

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

/**
 * Plantilla común de todos los paneles:
 * Inicio (estado + protocolo) → módulos de trabajo en orden de flujo →
 * Tareas → Apoyos.
 */
function PanelBody({ rol, tipo }: { rol: Rol; tipo: string }) {
  const esTitular = tipo === "titular";
  const { recargar, ...estado } = usePanelStatus(rol);
  const pendTareas = Math.max(estado.tareasTotal - estado.tareasHechas, 0);

  const tabs: PanelTab[] = [
    {
      id: "inicio",
      label: "Inicio",
      node: (go) => (
        <PanelInicio
          rol={rol}
          estado={estado}
          irA={go}
          consultas={
            rol === "admin" ? (
              <Link
                href="/panel/stage-manager/escaleta"
                className="db-ghost text-xs!"
              >
                Ver escaleta (consulta)
              </Link>
            ) : undefined
          }
        />
      ),
    },
  ];

  if (rol === "admin") {
    tabs.push(
      {
        id: "tareas",
        label: "Tareas",
        conteo: pendTareas,
        node: (
          <Seccion
            titulo="Tareas de todos los roles"
            nota="Progreso global del equipo, etiquetado por rol. Solo lectura."
          >
            <TaskList rol="admin" todas soloLectura />
          </Seccion>
        ),
      },
      {
        id: "inscripciones",
        label: "Inscripciones",
        conteo: estado.inscripcionesPendientes,
        node: (
          <Seccion
            titulo="Inscripciones de músicos"
            nota="Solicitudes recibidas. Los estados los asigna el Grupo Base."
          >
            <InscripcionesPanel editable={false} />
          </Seccion>
        ),
      },
      {
        id: "propuestas",
        label: "Propuestas",
        conteo: estado.propuestasPendientes,
        node: (
          <Seccion
            titulo="Propuestas de repertorio"
            nota="Pendientes y resueltas. Las resuelve el rol General."
          >
            <PropuestasPanel editable={false} />
          </Seccion>
        ),
      },
      {
        id: "instrumentos",
        label: "Instrumentos",
        node: (
          <Seccion
            titulo="Instrumentos confirmados"
            nota="Líneas por instrumento para planificación técnica."
          >
            <InstrumentosPanel />
          </Seccion>
        ),
      },
      {
        id: "caja",
        label: "Caja",
        node: (
          <Seccion
            titulo="Caja y fondos"
            nota="Movimientos, totales y cierre. Escritura exclusiva del rol Caja."
          >
            <CashModule puedeEscribir={false} />
          </Seccion>
        ),
      },
      {
        id: "historial",
        label: "Historial",
        node: (
          <Seccion
            titulo="Historial de sesiones"
            nota="Sesiones cerradas: participantes, roles del mes, tareas y resultado de caja. Solo lectura."
          >
            <HistoryReport />
          </Seccion>
        ),
      },
      {
        id: "rotacion",
        label: "Rotación",
        node: (
          <Seccion
            titulo="Rotación mensual de roles"
            nota="Tu única edición: asigna los titulares del mes (los apoyos los elige cada titular en su panel; el Grupo Base, el General). Los cambios actualizan los permisos de cada usuario."
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
        ),
      }
    );

    return <PanelTabs tabs={tabs} onCambio={recargar} />;
  }

  if (rol === "general") {
    tabs.push({
      id: "sesion",
      label: "Sesión",
      node: (
        <Seccion
          titulo="Datos, aprobación y cierre de la sesión"
          nota="Edita título, fecha, hora y lugar; aprueba para generar tareas; cierra tras la Jam para pasarlo al historial."
        >
          <ApproveCard puedeEditar={esTitular} />
        </Seccion>
      ),
    });
  }

  if (rol === "caja") {
    tabs.push({
      id: "caja",
      label: "Caja",
      node: (
        <Seccion titulo="Caja y Barra">
          <CashModule puedeEscribir={esTitular} />
        </Seccion>
      ),
    });
  }

  if (rol === "general") {
    tabs.push(
      {
        id: "propuestas",
        label: "Propuestas",
        conteo: estado.propuestasPendientes,
        node: (
          <Seccion
            titulo="Propuestas de repertorio"
            nota="Listado para validar en bloque: selecciona las propuestas y apruébalas o recházalas de una vez. Las aprobadas entran en el repertorio (informativo): el repertorio activo lo decide el Grupo Base. Siguen abiertas hasta que cierres el evento."
          >
            <PropuestasPanel editable={esTitular} />
          </Seccion>
        ),
      },
      {
        id: "grupo-base",
        label: "Grupo Base",
        node: (
          <Seccion
            titulo="Grupo Base del mes"
            nota="Tu grupo: no rota en la matriz. Quien esté en la lista tiene acceso al panel de Grupo Base."
          >
            <GrupoBasePanel />
          </Seccion>
        ),
      },
      {
        id: "auditoria",
        label: "Auditoría",
        node: (
          <Seccion
            titulo="Auditoría de fondos"
            nota="Lectura de la caja del evento. Solo el rol Caja escribe; tú (General) puedes cerrarla, pero verás un aviso: quedará registrado a tu nombre."
          >
            <CashModule puedeEscribir={false} puedeCerrar={esTitular} />
          </Seccion>
        ),
      }
    );
  }

  if (rol === "grupo-base") {
    tabs.push(
      {
        id: "propuestas",
        label: "Propuestas",
        conteo: estado.propuestasPendientes,
        node: (
          <Seccion
            titulo="Propuestas de la banda"
            nota="Lectura: las tienes en cuenta para definir el repertorio; quien aprueba es el General."
          >
            <PropuestasPanel editable={false} />
          </Seccion>
        ),
      },
      {
        id: "inscripciones",
        label: "Inscripciones",
        conteo: estado.inscripcionesPendientes,
        node: (
          <Seccion
            titulo="Inscripciones de músicos"
            nota="Instrumentos y temas solicitados. Asigna el estado de cada inscripción."
          >
            <InscripcionesPanel editable={esTitular} />
          </Seccion>
        ),
      },
      {
        id: "ensayo",
        label: "Ensayo",
        node: (
          <Seccion
            titulo="Ensayo general y cierre de inscripciones"
            nota="≈1 semana antes: decide el ensayo, cierra las inscripciones y anuncia la fecha."
          >
            <EnsayoPanel />
          </Seccion>
        ),
      },
      {
        id: "escaleta",
        label: "Escaleta",
        node: (
          <Seccion
            titulo="Escaleta en directo"
            nota="Orden de actuación operable desde el móvil durante la Jam."
          >
            <Link href="/panel/stage-manager/escaleta" className="db-btn">
              Abrir escaleta
            </Link>
          </Seccion>
        ),
      }
    );
  }

  if (rol === "stage-manager") {
    tabs.push({
      id: "escaleta",
      label: "Escaleta",
      node: (
        <Seccion
          titulo="Escaleta en directo"
          nota="Orden de actuación operable desde el móvil durante la Jam."
        >
          <Link href="/panel/stage-manager/escaleta" className="db-btn">
            Abrir escaleta
          </Link>
        </Seccion>
      ),
    });
  }

  if (rol === "tecnico") {
    tabs.push({
      id: "instrumentos",
      label: "Instrumentos",
      node: (
        <Seccion
          titulo="Instrumentos confirmados"
          nota="Líneas confirmadas por inscripción: base para microfonías y monitores."
        >
          <InstrumentosPanel />
        </Seccion>
      ),
    });
  }

  if (rol === "redes") {
    tabs.push({
      id: "difusion",
      label: "Difusión",
      node: (
        <Seccion
          titulo="Kit de difusión"
          nota="Datos del evento y textos base para cartel y publicaciones."
        >
          <DifusionKit />
        </Seccion>
      ),
    });
  }

  tabs.push({
    id: "tareas",
    label: "Tareas",
    conteo: pendTareas,
    node: (
      <Seccion
        titulo="Lista de tareas"
        nota="Tus tareas del evento: márcalas a medida que avanzas; los pasos (subtareas) se generan al aprobar la sesión."
      >
        <TaskList rol={rol} />
      </Seccion>
    ),
  });

  if (rol !== "grupo-base") {
    tabs.push({
      id: "apoyos",
      label: "Apoyos",
      node: (
        <Seccion
          titulo="Apoyos de tu rol"
          nota="Elige quién apoya tu rol este mes: los apoyos entran a tu panel en modo solo lectura."
        >
          <ApoyosPanel rol={rol} />
        </Seccion>
      ),
    });
  }

  return <PanelTabs tabs={tabs} onCambio={recargar} />;
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
    <div className="mx-auto max-w-4xl px-4 pt-6 pb-16">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/panel" className="db-kicker underline">
            ← Paneles
          </Link>
          <p className="db-kicker mt-1">Debarock Kolektiboa</p>
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
