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
      "Vista global de solo lectura, gestión de usuarios y rotación mensual de roles.",
  },
  general: {
    label: "General · Coordinador",
    description:
      "Crea el Grupo Base del mes, aprueba la sesión y el repertorio, y audita los fondos.",
  },
  "grupo-base": {
    label: "Grupo Base · House Band",
    description:
      "Repertorio activo del mes (grupo que nombra el General), inscripciones y escaleta base.",
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

/** Icono de navegación de cada rol (chips del hub, hoja de cambio, etc.). */
export const ROL_ICONO: Record<Rol, string> = {
  admin: "rotacion",
  general: "sesion",
  "grupo-base": "grupo-base",
  "stage-manager": "escaleta",
  tecnico: "instrumentos",
  caja: "caja",
  redes: "difusion",
};

/** Fases del ciclo de una sesión (agrupan el protocolo de cada rol). */
export type FaseGuia = "preparacion" | "semana" | "dia" | "cierre";

export const FASES: { id: FaseGuia; label: string; desc: string }[] = [
  { id: "preparacion", label: "Preparación", desc: "Antes de la semana de la Jam" },
  { id: "semana", label: "Semana de la Jam", desc: "≈1 semana antes" },
  { id: "dia", label: "Día de la Jam", desc: "Durante el evento" },
  { id: "cierre", label: "Cierre", desc: "Tras la Jam y fin de mes" },
];

/** Un paso del protocolo de un rol; `irA` salta a esa pestaña. */
export interface PasoGuia {
  texto: string;
  fase: FaseGuia;
  irA?: string;
}

/**
 * Protocolo de cada rol, agrupado por fases del ciclo de la sesión
 * (modal «Protocolo» del panel). `irA` enlaza con la pestaña donde se
 * hace cada cosa.
 */
export const ROLE_GUIDES: Record<Rol, PasoGuia[]> = {
  admin: [
    {
      fase: "preparacion",
      texto:
        "Mira tu Inicio: estado de la sesión y pendientes de todo el equipo.",
    },
    {
      fase: "preparacion",
      texto: "Comprueba el progreso global de tareas de todos los roles.",
      irA: "tareas",
    },
    {
      fase: "preparacion",
      texto:
        "Revisa las inscripciones pendientes de estado (las asigna el Grupo Base).",
      irA: "inscripciones",
    },
    {
      fase: "preparacion",
      texto: "Consulta las propuestas y cómo las resuelve el General.",
      irA: "propuestas",
    },
    {
      fase: "preparacion",
      texto:
        "Verifica los instrumentos confirmados para la planificación técnica.",
      irA: "instrumentos",
    },
    {
      fase: "dia",
      texto:
        "Durante la Jam: comprueba que la caja registra movimientos y que nadie está bloqueado.",
      irA: "caja",
    },
    {
      fase: "cierre",
      texto: "Tras la Jam: revisa la caja y el resultado del evento.",
      irA: "caja",
    },
    {
      fase: "cierre",
      texto: "Repasa el historial de sesiones cerradas.",
      irA: "historial",
    },
    {
      fase: "cierre",
      texto:
        "Antes del día 25: ejecuta la Rotación (titulares, altas y bajas).",
      irA: "rotacion",
    },
    {
      fase: "cierre",
      texto:
        "Comprueba que los nuevos titulares entran en su panel y que los apoyos solo leen.",
      irA: "rotacion",
    },
  ],
  general: [
    {
      fase: "preparacion",
      texto: "Define los datos de la sesión: título, fecha, hora y lugar.",
      irA: "sesion",
    },
    {
      fase: "preparacion",
      texto: "Valora la viabilidad logística y económica antes de aprobar nada.",
    },
    {
      fase: "preparacion",
      texto:
        "Valida en bloque las propuestas: las aprobadas entran al repertorio informativo; el activo lo decide el Grupo Base.",
      irA: "propuestas",
    },
    {
      fase: "preparacion",
      texto: "Aprueba la sesión: se generan las tareas de todos los roles.",
      irA: "sesion",
    },
    {
      fase: "preparacion",
      texto: "Elige el Grupo Base del mes (no rota en la matriz).",
      irA: "grupo-base",
    },
    {
      fase: "preparacion",
      texto: "Elige tus apoyos del mes.",
      irA: "apoyos",
    },
    {
      fase: "semana",
      texto: "Revisa que GB ha fijado el ensayo y que Redes difunde la fecha.",
      irA: "ensayo",
    },
    {
      fase: "dia",
      texto:
        "Día de la Jam: coordina imprevistos con Stage Manager y Técnico.",
      irA: "escaleta",
    },
    {
      fase: "cierre",
      texto:
        "Tras la Jam: audita los fondos; si hace falta, cierra la caja tú (quedará a tu nombre).",
      irA: "auditoria",
    },
    {
      fase: "cierre",
      texto: "Con la caja cerrada: cierra el evento y crea la siguiente sesión.",
      irA: "sesion",
    },
    {
      fase: "cierre",
      texto: "Ve marcando en tu lista las tareas completadas.",
      irA: "tareas",
    },
  ],
  "grupo-base": [
    {
      fase: "preparacion",
      texto: "Revisa las propuestas: las tienes en cuenta; aprueba el General.",
      irA: "propuestas",
    },
    {
      fase: "preparacion",
      texto: "Define el repertorio activo del mes (temas en Drive).",
    },
    {
      fase: "preparacion",
      texto:
        "Asigna el estado de cada inscripción (asignado / parcial / rechazado).",
      irA: "inscripciones",
    },
    {
      fase: "semana",
      texto: "≈1 semana antes: fija el ensayo general.",
      irA: "ensayo",
    },
    {
      fase: "semana",
      texto: "Cierra las inscripciones y pide a Redes que difunda la fecha.",
      irA: "ensayo",
    },
    {
      fase: "semana",
      texto:
        "Monta la escaleta base y comunica orden e intérpretes a SM y Técnico.",
      irA: "escaleta",
    },
    {
      fase: "dia",
      texto:
        "Día de la Jam: resuelve cambios de última hora con el Stage Manager.",
      irA: "escaleta",
    },
    {
      fase: "cierre",
      texto:
        "Tras la Jam: marca las tareas completadas y revisa propuestas pendientes.",
      irA: "tareas",
    },
  ],
  "stage-manager": [
    { fase: "preparacion", texto: "Elige tus apoyos del mes.", irA: "apoyos" },
    {
      fase: "semana",
      texto: "D-1: monta la escaleta base con turnos y duraciones estimadas.",
      irA: "escaleta",
    },
    {
      fase: "semana",
      texto: "D-1: confirma intérpretes y cambios con el Grupo Base.",
      irA: "escaleta",
    },
    {
      fase: "dia",
      texto: "Briefing con los músicos antes de abrir puertas.",
    },
    {
      fase: "dia",
      texto:
        "En directo: opera la escaleta (en espera → en escena → terminado).",
      irA: "escaleta",
    },
    {
      fase: "dia",
      texto: "Al cierre: repasa que todos los turnos están en «terminado».",
      irA: "escaleta",
    },
    {
      fase: "cierre",
      texto: "Registra incidencias como tareas y déjalas marcadas.",
      irA: "tareas",
    },
  ],
  tecnico: [
    { fase: "preparacion", texto: "Elige tus apoyos del mes.", irA: "apoyos" },
    {
      fase: "preparacion",
      texto: "Revisa los instrumentos confirmados: líneas y músicos.",
      irA: "instrumentos",
    },
    {
      fase: "preparacion",
      texto: "Planifica microfonías, líneas y monitores.",
    },
    {
      fase: "semana",
      texto: "D-1: comprueba amplificadores, consolas y equipo de repuesto.",
    },
    {
      fase: "dia",
      texto: "Soundcheck por turnos coordinado con el Stage Manager.",
    },
    {
      fase: "cierre",
      texto: "Registra incidencias como tareas y ve marcándolas.",
      irA: "tareas",
    },
  ],
  caja: [
    { fase: "preparacion", texto: "Elige tus apoyos del mes.", irA: "apoyos" },
    {
      fase: "preparacion",
      texto: "Prepara el cambio inicial y revisa los precios de consumos.",
      irA: "caja",
    },
    {
      fase: "dia",
      texto:
        "Durante la Jam: registra consumos, aportaciones del barra y gastos.",
      irA: "caja",
    },
    {
      fase: "dia",
      texto: "Comprueba que los totales cuadran con lo cobrado en mano.",
    },
    {
      fase: "cierre",
      texto: "Al cierre: fondo inicial, efectivo contado y cierra la caja.",
      irA: "caja",
    },
    {
      fase: "cierre",
      texto: "Entrega el fondo y comunica el beneficio al General.",
      irA: "caja",
    },
    {
      fase: "cierre",
      texto: "Ve marcando las tareas completadas.",
      irA: "tareas",
    },
  ],
  redes: [
    { fase: "preparacion", texto: "Elige tus apoyos del mes.", irA: "apoyos" },
    {
      fase: "preparacion",
      texto: "Usa el Kit de difusión: texto base y enlace de la sesión.",
      irA: "difusion",
    },
    {
      fase: "semana",
      texto:
        "Publica el cartel con antelación (fecha, lugar, #DebarockKolektiboa).",
      irA: "difusion",
    },
    {
      fase: "dia",
      texto: "Cobertura audiovisual durante la Jam (fotos/vídeos con permiso).",
    },
    {
      fase: "cierre",
      texto: "Post-evento: publica agradecimientos, material y resultados.",
      irA: "difusion",
    },
    {
      fase: "cierre",
      texto: "Ve marcando las tareas completadas.",
      irA: "tareas",
    },
  ],
};

/** Nota al pie del modal de protocolo (roles con particularidades). */
export const ROLE_NOTAS: Partial<Record<Rol, string>> = {
  admin: "Tu rol no admite apoyos y no modifica tareas, caja ni escaleta: deriva cada incidencia al rol responsable.",
};
