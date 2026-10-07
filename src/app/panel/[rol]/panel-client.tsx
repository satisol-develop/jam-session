"use client";

import { useCallback, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { ROLES_META } from "@/lib/constants";
import { ROLES } from "@/types";
import type { Rol } from "@/types";
import { TaskList } from "@/components/panel/task-list";
import { ApoyosPanel } from "@/components/panel/apoyos-panel";
import { RotationPanel } from "@/components/admin/rotation-panel";
import { HistoryReport } from "@/components/admin/history-report";
import { UsuariosPanel } from "@/components/admin/usuarios-panel";
import { ApproveCard } from "@/components/panel/approve-card";
import { CashModule } from "@/components/panel/cash-module";
import { InscripcionesPanel } from "@/components/panel/inscripciones-panel";
import { InstrumentosPanel } from "@/components/panel/instrumentos-panel";
import { PropuestasPanel } from "@/components/panel/propuestas-panel";
import { DifusionKit } from "@/components/panel/difusion-kit";
import { EnsayoPanel } from "@/components/panel/ensayo-panel";
import { GrupoBasePanel } from "@/components/panel/grupo-base-panel";
import { RepertorioPanel } from "@/components/panel/repertorio-panel";
import { PanelInicio } from "@/components/panel/panel-inicio";
import { ProtocoloModal } from "@/components/panel/protocolo-modal";
import { usePanelStatus } from "@/components/panel/use-panel-status";
import { PanelTabs, type PanelTab } from "@/components/panel/panel-tabs";
import { AdminSidebar } from "@/components/panel/admin-sidebar";
import { AdminKpis } from "@/components/panel/admin-kpis";
import { proximoPaso } from "@/lib/panel/proximo-paso";

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
    <section className="db-card p-4 sm:p-6">
      <h2 className="db-title mb-1 text-base">{titulo}</h2>
      {nota && <p className="db-muted mb-4 text-sm">{nota}</p>}
      <div className={nota ? "" : "mt-3"}>{children}</div>
    </section>
  );
}

/**
 * Plantilla común de todos los paneles: cabecera con acceso al
 * Protocolo, Inicio (resumen + siguiente paso) → módulos de trabajo en
 * orden de flujo → Tareas → Apoyos. Gestiona el hash, los contadores
 * y el modal de protocolo.
 */
function PanelBody({ rol, tipo }: { rol: Rol; tipo: string }) {
  const esTitular = tipo === "titular";
  const { roles: rolesUsuario } = useAuth();
  const { recargar, ...estado } = usePanelStatus(rol);
  const pendTareas = Math.max(estado.tareasTotal - estado.tareasHechas, 0);
  const paso = proximoPaso(rol, estado);

  const [activo, setActivo] = useState(() =>
    typeof window === "undefined"
      ? ""
      : decodeURIComponent(window.location.hash.slice(1)),
  );
  const [protocolo, setProtocolo] = useState(false);
  const cerrarProtocolo = useCallback(() => setProtocolo(false), []);
  const abrirProtocolo = useCallback(() => setProtocolo(true), []);

  function seleccionar(id: string) {
    setActivo(id);
    window.history.replaceState(null, "", `#${id}`);
    recargar();
  }

  function irA(id: string) {
    setProtocolo(false);
    seleccionar(id);
  }

  const tabs: PanelTab[] = [
    {
      id: "inicio",
      label: "Inicio",
      primaria: true,
      node: (
        <PanelInicio
          rol={rol}
          estado={estado}
          paso={paso}
          irA={seleccionar}
          onProtocolo={abrirProtocolo}
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
        primaria: true,
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
        primaria: true,
        conteo: estado.inscripcionesPendientes,
        node: (
          <Seccion
            titulo="Inscripciones de músicos"
            nota="Solicitudes recibidas; los estados los asigna el Grupo Base."
          >
            <InscripcionesPanel editable={false} />
          </Seccion>
        ),
      },
      {
        id: "propuestas",
        label: "Propuestas",
        primaria: true,
        conteo: estado.propuestasPendientes,
        node: (
          <Seccion
            titulo="Propuestas de repertorio"
            nota="Pendientes y resueltas; las resuelve el rol General."
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
            nota="Líneas por instrumento para la planificación técnica."
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
            nota="Movimientos y totales. Solo el rol Caja escribe."
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
            nota="Sesiones cerradas: roles, tareas y resultado de caja."
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
            nota="Tu única edición: titulares del mes; al guardar se actualizan los permisos."
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
      },
      {
        id: "usuarios",
        label: "Usuarios",
        node: (
          <Seccion
            titulo="Gestión de usuarios"
            nota="Alta de participantes con contraseña por defecto y verificación de correo."
          >
            <UsuariosPanel />
          </Seccion>
        ),
      }
    );
  } else {
    if (rol === "general") {
      tabs.push({
        id: "sesion",
        label: "Sesión",
        primaria: true,
        node: (
          <Seccion
            titulo="Datos, aprobación y cierre de la sesión"
            nota="Edita los datos, aprueba para generar tareas y cierra tras la Jam."
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
        primaria: true,
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
          id: "repertorio",
          label: "Repertorio",
          primaria: true,
          node: (
            <Seccion
              titulo="Repertorio del mes"
              nota="Añade temas que verán la web, /mi y /partituras. El Grupo Base también puede."
            >
              <RepertorioPanel editable={esTitular} />
            </Seccion>
          ),
        },
        {
          id: "propuestas",
          label: "Propuestas",
          primaria: true,
          conteo: estado.propuestasPendientes,
          node: (
            <Seccion
              titulo="Propuestas de repertorio"
              nota="Valida en bloque: las aprobadas entran al repertorio informativo; el activo lo decide el Grupo Base."
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
              nota="Tu grupo del mes: no rota y tiene acceso a su panel."
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
              nota="Lectura de la caja; tú puedes cerrarla con aviso (quedará a tu nombre)."
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
          id: "repertorio",
          label: "Repertorio",
          primaria: true,
          node: (
            <Seccion
              titulo="Repertorio del mes"
              nota="Define el repertorio: los temas que añadas aparecerán en la web, /mi y /partituras."
            >
              <RepertorioPanel editable={esTitular} />
            </Seccion>
          ),
        },
        {
          id: "propuestas",
          label: "Propuestas",
          primaria: true,
          conteo: estado.propuestasPendientes,
          node: (
            <Seccion
              titulo="Propuestas de la banda"
              nota="Lectura: las tienes en cuenta; aprueba el General."
            >
              <PropuestasPanel editable={false} />
            </Seccion>
          ),
        },
        {
          id: "inscripciones",
          label: "Inscripciones",
          primaria: true,
          conteo: estado.inscripcionesPendientes,
          node: (
            <Seccion
              titulo="Inscripciones de músicos"
              nota="Asigna el estado de cada músico: asignado / parcial / rechazado."
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
              nota="≈1 semana antes: fija el ensayo y cierra las inscripciones."
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
        primaria: true,
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
        primaria: true,
        node: (
          <Seccion
            titulo="Instrumentos confirmados"
            nota="Líneas confirmadas: base para microfonías y monitores."
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
        primaria: true,
        node: (
          <Seccion
            titulo="Kit de difusión"
            nota="Datos del evento y textos base para cartel y publicaciones."
          >
            <DifusionKit editable={esTitular} />
          </Seccion>
        ),
      });
    }

    tabs.push({
      id: "tareas",
      label: "Tareas",
      primaria: true,
      conteo: pendTareas,
      node: (
        <Seccion
          titulo="Lista de tareas"
          nota="Tus tareas del evento: márcalas y ve añadiendo pasos."
        >
          <TaskList rol={rol} />
        </Seccion>
      ),
    });

    if (rol !== "grupo-base") {
      tabs.push({
        id: "apoyos",
        label: "Apoyos",
        primaria: rol !== "general",
        node: (
          <Seccion
            titulo="Apoyos de tu rol"
            nota="Elige quién apoya tu rol este mes (entra en solo lectura)."
          >
            <ApoyosPanel rol={rol} />
          </Seccion>
        ),
      });
    }
  }

  const tabActual = tabs.find((t) => t.id === activo) ?? tabs[0];

  const soloUnRol = ROLES.filter((r) => rolesUsuario[r]).length === 1;

  const cabecera = (
    <header className="mb-4">
      {soloUnRol ? (
        <span className="db-kicker">Panel</span>
      ) : (
        <Link href="/panel" className="db-kicker underline">
          ← Paneles
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-2.5">
        <h1 className="db-title text-2xl sm:text-4xl">
          {ROLES_META[rol].label}
        </h1>
        <span
          className={`db-badge ${
            tipo === "titular" ? "db-badge-solid" : "db-badge-line"
          }`}
        >
          {tipo}
        </span>
        <button
          type="button"
          onClick={abrirProtocolo}
          className="db-ghost ml-auto min-h-10 px-3 py-2 text-xs!"
        >
          Protocolo
        </button>
      </div>
      <p className="db-muted mt-1 hidden text-sm sm:block">
        {ROLES_META[rol].description}
      </p>
    </header>
  );

  // Administración: sidebar lateral + tarjetas KPI (estilo plantilla admin).
  if (rol === "admin") {
    return (
      <>
        {cabecera}
        <div className="md:flex md:items-start md:gap-6">
          <AdminSidebar
            tabs={tabs}
            activo={tabActual.id}
            onSeleccionar={seleccionar}
            onProtocolo={abrirProtocolo}
          />
          <div className="min-w-0 flex-1 pb-24 sm:pb-0">
            <PanelTabs
              tabs={tabs}
              activo={tabActual.id}
              onSeleccionar={seleccionar}
              onProtocolo={abrirProtocolo}
              paraSidebar
            />
            <div className="mt-3 space-y-3 sm:mt-4 sm:space-y-4">
              <AdminKpis estado={estado} />
              <div key={tabActual.id} className="db-fade">
                {tabActual.node}
              </div>
            </div>
          </div>
        </div>

        {protocolo && (
          <ProtocoloModal rol={rol} onCerrar={cerrarProtocolo} irA={irA} />
        )}
      </>
    );
  }

  return (
    <>
      {cabecera}

      <PanelTabs
        tabs={tabs}
        activo={activo}
        onSeleccionar={seleccionar}
        onProtocolo={abrirProtocolo}
      />

      {protocolo && (
        <ProtocoloModal rol={rol} onCerrar={cerrarProtocolo} irA={irA} />
      )}
    </>
  );
}

export function RolPanelClient({ rol: rolParam }: { rol: string }) {
  const { roles, loading } = useAuth();
  const { pendiente } = useRequireAuth();
  const rol = rolParam as Rol;
  const valido = ROLES.includes(rol);
  const tipo = roles[rol];

  if (pendiente || loading) {
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
    <div
      className={`mx-auto px-4 pt-5 pb-16 sm:pt-6 ${
        rol === "admin" ? "max-w-6xl" : "max-w-4xl"
      }`}
    >
      <PanelBody rol={rol} tipo={tipo} />
    </div>
  );
}
