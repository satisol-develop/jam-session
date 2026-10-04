import type { Rol } from "@/types";

export const INSTRUMENTOS = [
  "Voz",
  "Coro",
  "Guitarra",
  "Bajo",
  "Teclado",
  "Piano",
  "Batería",
  "Percusión",
  "Saxo",
  "Trompeta",
  "Armónica",
  "Violín",
  "Flauta",
] as const;

export const ROLES_META: Record<
  Rol,
  { label: string; description: string }
> = {
  admin: {
    label: "Administrador",
    description:
      "Vista global de solo lectura y rotación mensual de roles (única edición).",
  },
  general: {
    label: "General · Coordinador",
    description:
      "Crea el Grupo Base del mes, aprueba la sesión y el repertorio, y audita los fondos.",
  },
  "grupo-base": {
    label: "Grupo Base · House Band",
    description:
      "Repertorio activo del mes (grupo que nombra el General), inscripciones y quién toca cada tema.",
  },
  "stage-manager": {
    label: "Stage Manager · Gestión del Día",
    description: "Opera la escaleta en tiempo real desde el móvil durante la Jam.",
  },
  tecnico: {
    label: "Técnico de Sonido",
    description:
      "Lista de instrumentos confirmados y necesidades de equipamiento.",
  },
  caja: {
    label: "Caja y Barra",
    description: "Ventas, cobros y cuadre de caja durante el evento.",
  },
  redes: {
    label: "Redes · Marketing",
    description:
      "Carteles, difusión, cobertura audiovisual y post-evento.",
  },
};

/** Un paso del protocolo de la pestaña Inicio; `irA` salta a esa pestaña. */
export interface PasoGuia {
  texto: string;
  irA?: string;
}

/**
 * Protocolo paso a paso de cada rol (pestaña «Inicio» de su panel).
 * El orden es el flujo de trabajo real y `irA` enlaza con la pestaña
 * donde se hace cada cosa.
 */
export const ROLE_GUIDES: Record<Rol, PasoGuia[]> = {
  admin: [
    {
      texto:
        "Mira el resumen de arriba: estado de la sesión, tareas del equipo, propuestas, inscripciones y caja.",
    },
    {
      texto: "Comprueba el progreso global de tareas de todos los roles.",
      irA: "tareas",
    },
    {
      texto:
        "Revisa las inscripciones pendientes de estado (las asigna el Grupo Base).",
      irA: "inscripciones",
    },
    {
      texto:
        "Consulta las propuestas y cómo las ha resuelto el General.",
      irA: "propuestas",
    },
    {
      texto:
        "Verifica los instrumentos confirmados para la planificación técnica.",
      irA: "instrumentos",
    },
    {
      texto: "Comprueba la caja: movimientos y si está cerrada.",
      irA: "caja",
    },
    {
      texto: "Repasa el historial de sesiones cerradas.",
      irA: "historial",
    },
    {
      texto:
        "Antes del día 25 de cada mes, ejecuta la Rotación: titulares del mes, altas y bajas de usuarios.",
      irA: "rotacion",
    },
    {
      texto:
        "Comprueba que los nuevos titulares entran en su panel y que los apoyos solo leen.",
      irA: "rotacion",
    },
    {
      texto:
        "Tu rol no admite apoyos y no modifica tareas, caja ni escaleta: deriva cada incidencia al rol responsable.",
    },
  ],
  general: [
    {
      texto: "Define los datos de la sesión: título, fecha, hora y lugar.",
      irA: "sesion",
    },
    {
      texto:
        "Valora la viabilidad logística y económica antes de aprobar nada.",
    },
    {
      texto:
        "Valida en bloque las propuestas de los músicos: las aprobadas entran al repertorio informativo; el repertorio activo lo decide el Grupo Base.",
      irA: "propuestas",
    },
    {
      texto:
        "Aprueba la sesión: se generan automáticamente las tareas de todos los roles.",
      irA: "sesion",
    },
    {
      texto:
        "Elige quiénes forman el Grupo Base del mes (no rota en la matriz).",
      irA: "grupo-base",
    },
    {
      texto:
        "Audita los fondos tras la Jam; si hace falta cerrar la caja antes que Caja, puedes hacerlo tú (quedará a tu nombre).",
      irA: "auditoria",
    },
    {
      texto:
        "Cuando la caja esté cerrada, cierra el evento y crea la siguiente sesión.",
      irA: "sesion",
    },
    {
      texto: "Elige tus apoyos del mes.",
      irA: "apoyos",
    },
    {
      texto:
        "Ve marcando en tu lista las tareas completadas de cada paso.",
      irA: "tareas",
    },
  ],
  "grupo-base": [
    {
      texto:
        "Revisa las propuestas de la banda: las tienes en cuenta para decidir, pero quien aprueba es el General.",
      irA: "propuestas",
    },
    {
      texto: "Define el repertorio activo del mes (temas activos en Drive).",
    },
    {
      texto:
        "Revisa las inscripciones y asigna el estado de cada músico (asignado / parcial / rechazado).",
      irA: "inscripciones",
    },
    {
      texto:
        "≈1 semana antes: fija el ensayo general y cierra las inscripciones para anunciar la fecha.",
      irA: "ensayo",
    },
    {
      texto:
        "Monta la escaleta base (orden de apertura y quién toca cada tema) y comunica el orden al Stage Manager y al Técnico.",
      irA: "escaleta",
    },
    {
      texto: "Ve marcando en tu lista las tareas completadas de cada paso.",
      irA: "tareas",
    },
  ],
  "stage-manager": [
    {
      texto: "Elige tus apoyos del mes.",
      irA: "apoyos",
    },
    {
      texto: "D-1: monta la escaleta base con turnos y duraciones estimadas.",
      irA: "escaleta",
    },
    {
      texto: "D-1: confirma intérpretes y cambios con el Grupo Base.",
      irA: "escaleta",
    },
    {
      texto: "Día de la Jam: briefing con los músicos antes de abrir puertas.",
    },
    {
      texto:
        "En directo: opera la escaleta desde el móvil (en espera → en escena → terminado).",
      irA: "escaleta",
    },
    {
      texto:
        "Al cierre: repasa que todos los turnos quedaron en «terminado».",
      irA: "escaleta",
    },
    {
      texto: "Registra incidencias y pendientes en tu lista de tareas.",
      irA: "tareas",
    },
  ],
  tecnico: [
    {
      texto: "Elige tus apoyos del mes.",
      irA: "apoyos",
    },
    {
      texto:
        "Revisa los instrumentos confirmados: líneas y músicos por instrumento.",
      irA: "instrumentos",
    },
    {
      texto: "Planifica microfonías, líneas y monitores según esas líneas.",
    },
    {
      texto: "D-1: comprueba amplificadores, consolas y equipo de repuesto.",
    },
    {
      texto: "Día de la Jam: soundcheck por turnos coordinado con el SM.",
    },
    {
      texto: "Registra incidencias como tareas y ve marcándolas.",
      irA: "tareas",
    },
  ],
  caja: [
    {
      texto: "Elige tus apoyos del mes.",
      irA: "apoyos",
    },
    {
      texto: "Prepara el cambio inicial y revisa los precios de los consumos.",
      irA: "caja",
    },
    {
      texto:
        "Durante la Jam: registra consumos, aportaciones del barra y gastos en el módulo.",
      irA: "caja",
    },
    {
      texto:
        "Al cierre: introduce fondo inicial y efectivo contado, cuadra y cierra la caja.",
      irA: "caja",
    },
    {
      texto:
        "Entrega el fondo y comunica el beneficio (ingresos − gastos) al General.",
    },
    {
      texto: "Ve marcando en tu lista las tareas completadas.",
      irA: "tareas",
    },
  ],
  redes: [
    {
      texto: "Elige tus apoyos del mes.",
      irA: "apoyos",
    },
    {
      texto:
        "Usa el Kit de difusión: copia el texto base y el enlace de la sesión.",
      irA: "difusion",
    },
    {
      texto:
        "Diseña el cartel y publícalo con antelación (fecha, lugar, #DebarockKolektiboa).",
      irA: "difusion",
    },
    {
      texto: "Durante la Jam: cobertura audiovisual (fotos/vídeos con permiso).",
    },
    {
      texto: "Post-evento: publica agradecimientos, material y resultados.",
    },
    {
      texto: "Ve marcando en tu lista las tareas completadas.",
      irA: "tareas",
    },
  ],
};