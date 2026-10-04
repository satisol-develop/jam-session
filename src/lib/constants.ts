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

/** Guía de proceso paso a paso de cada rol (se muestra en su panel). */
export const ROLE_GUIDES: Record<Rol, string[]> = {
  admin: [
    "Revisa la Vista global (solo lectura): estado de la sesión, tareas de todos los roles, escaleta, inscripciones y caja.",
    "Consulta el Historial de sesiones cerradas: participantes, roles del mes, tareas completadas y resultado de caja.",
    "Antes del día 25 de cada mes, ejecuta la Rotación: asigna el titular de cada rol y guarda (los apoyos los eligen los titulares en su panel; el Grupo Base lo elige el General).",
    "Comprueba que cada nuevo titular puede entrar en su panel y que los apoyos solo leen.",
    "En la matriz, da de baja a usuarios inactivos y da de alta a los nuevos.",
    "Tu rol es de observación y no admite apoyos: solo tú entras en este panel. No modificas tareas, caja, escaleta ni aprobaciones; deriva cada incidencia al rol responsable.",
  ],
  general: [
    "Define los datos de la sesión en «Datos, aprobación y cierre»: título, fecha, hora y lugar.",
    "Valora la viabilidad logística y económica de la sesión (fecha, lugar, coste) antes de aprobar nada.",
    "Revisa el listado de Propuestas de los músicos y válidalas en bloque (selecciona y aprueba o rechaza de una vez): las aprobadas entran en el repertorio, que es informativo; el repertorio activo lo decide el Grupo Base.",
    "Aprueba la sesión: se generan automáticamente las tareas de todos los roles.",
    "Elige quiénes forman el Grupo Base del mes en «Grupo Base del mes» (es tu grupo; no rota en la matriz) y revisa las inscripciones de músicos.",
    "Elige tus apoyos del mes en «Apoyos de tu rol»: usuarios con acceso de solo lectura para apoyarte.",
    "Tras la Jam, audita los fondos en «Auditoría de fondos». Si hace falta cerrar antes de que lo haga Caja, puedes hacerlo tú: verás un aviso y el cierre quedará registrado a tu nombre en el historial.",
    "Cuando la caja esté cerrada, cierra el evento: se congelará la operativa y quedará archivado en el historial.",
    "Crea la siguiente sesión (mes, fecha, hora y lugar) cuando toque abrir el próximo ciclo.",
    "Ve marcando en tu lista las tareas completadas de cada paso.",
  ],
  "grupo-base": [
    "Revisa las Propuestas de la banda: las tienes en cuenta para decidir, pero quien aprueba el repertorio es el General.",
    "Define el repertorio activo del mes (temas activos en Drive).",
    "Revisa las Inscripciones: asigna estado a cada músico (asignado / parcial / rechazado).",
    "≈1 semana antes: fija el ensayo general; cierra las inscripciones cuando quieras anunciarlo (recomendado: unos días antes de la Jam) y pide a Redes que difunda la fecha.",
    "Las propuestas de temas siguen abiertas hasta que el General cierre el evento.",
    "Monta la escaleta base: orden de apertura y quién toca cada tema.",
    "Comunica el orden y los intérpretes al Stage Manager y al Técnico.",
    "Ve marcando en tu lista las tareas completadas de cada paso.",
  ],
  "stage-manager": [
    "Elige tus apoyos del mes en «Apoyos de tu rol»: usuarios con acceso de solo lectura para apoyarte.",
    "D-1: monta la escaleta base con turnos y duraciones estimadas.",
    "D-1: confirma intérpretes y cambios con el Grupo Base.",
    "Día de la Jam: briefing con los músicos antes de abrir puertas.",
    "En directo: opera la escaleta desde el móvil (en espera → en escena → terminado).",
    "Al cierre: repasa que todos los turnos quedaron en «terminado» y guarda la escaleta.",
  ],
  tecnico: [
    "Elige tus apoyos del mes en «Apoyos de tu rol»: usuarios con acceso de solo lectura para apoyarte.",
    "Revisa los Instrumentos confirmados: líneas y músicos por instrumento.",
    "Planifica microfonías, líneas y monitores según esas líneas.",
    "D-1: comprueba amplificadores, consolas y equipo de repuesto.",
    "Día de la Jam: soundcheck por turnos coordinado con el Stage Manager.",
    "Registra incidencias como tareas del rol y ve marcándolas.",
  ],
  caja: [
    "Elige tus apoyos del mes en «Apoyos de tu rol»: usuarios con acceso de solo lectura para apoyarte.",
    "Prepara el cambio inicial y revisa los precios de los consumos.",
    "Durante la Jam: registra consumos, aportaciones del barra y gastos en el módulo.",
    "Comprueba que los totales cuadran con lo cobrado en mano.",
    "Al cierre: introduce fondo inicial y efectivo contado, y cierra la caja (si el General la cierra antes, quedará registrada a su nombre y no podrás registrar más movimientos).",
    "Entrega el fondo y comunica el beneficio (ingresos − gastos) al rol General.",
  ],
  redes: [
    "Elige tus apoyos del mes en «Apoyos de tu rol»: usuarios con acceso de solo lectura para apoyarte.",
    "Usa el Kit de difusión: copia el texto base y el enlace de la sesión.",
    "Diseña el cartel y publícalo con antelación (fecha, lugar, #DebarockKolektiboa).",
    "Durante la Jam: cobertura audiovisual (fotos/vídeos con permiso).",
    "Post-evento: publica agradecimientos, material y resultados.",
    "Ve marcando en tu lista las tareas completadas de cada paso.",
  ],
};