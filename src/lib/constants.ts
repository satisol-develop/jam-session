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
      "Aprueba la sesión, valida propuestas y audita los fondos recaudados.",
  },
  "grupo-base": {
    label: "Grupo Base · House Band",
    description:
      "Repertorio activo del mes y asignación final de quién toca cada tema.",
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
    "Antes del día 25 de cada mes, ejecuta la Rotación: asigna titular y apoyo a cada rol y guarda.",
    "Comprueba que cada nuevo titular puede entrar en su panel y que los apoyos solo leen.",
    "En la matriz, da de baja a usuarios inactivos y da de alta a los nuevos.",
    "Tu rol es de observación: no modificas tareas, caja, escaleta ni aprobaciones; deriva cada incidencia al rol responsable.",
  ],
  general: [
    "Valora la viabilidad logística y económica de la sesión (fecha, lugar, coste) antes de aprobar nada.",
    "Revisa las Propuestas de repertorio y aprueba o rechaza cada una.",
    "Aprueba la sesión: se generan automáticamente las tareas de todos los roles.",
    "Confirma la asignación del Grupo Base y revisa las inscripciones de músicos.",
    "Tras la Jam, audita los fondos en «Auditoría de fondos» (solo lectura de la caja).",
    "Ve marcando en tu lista las tareas completadas de cada paso.",
  ],
  "grupo-base": [
    "Define el repertorio activo del mes (temas activos en Drive).",
    "Revisa las Inscripciones: asigna estado a cada músico (asignado / parcial / rechazado).",
    "Evalúa las propuestas aprobadas por General y añádelas al repertorio.",
    "Monta la escaleta base: orden de apertura y quién toca cada tema.",
    "Comunica el orden y los intérpretes al Stage Manager y al Técnico.",
    "Ve marcando en tu lista las tareas completadas de cada paso.",
  ],
  "stage-manager": [
    "D-1: monta la escaleta base con turnos y duraciones estimadas.",
    "D-1: confirma intérpretes y cambios con el Grupo Base.",
    "Día de la Jam: briefing con los músicos antes de abrir puertas.",
    "En directo: opera la escaleta desde el móvil (en espera → en escena → terminado).",
    "Al cierre: repasa que todos los turnos quedaron en «terminado» y guarda la escaleta.",
  ],
  tecnico: [
    "Revisa los Instrumentos confirmados: líneas y músicos por instrumento.",
    "Planifica microfonías, líneas y monitores según esas líneas.",
    "D-1: comprueba amplificadores, consolas y equipo de repuesto.",
    "Día de la Jam: soundcheck por turnos coordinado con el Stage Manager.",
    "Registra incidencias como tareas del rol y ve marcándolas.",
  ],
  caja: [
    "Prepara el cambio inicial y revisa los precios de entradas y consumos.",
    "Durante la Jam: registra cada entrada y consumición en el módulo.",
    "Comprueba que los totales cuadran con lo cobrado en mano.",
    "Al cierre: introduce fondo inicial y efectivo contado, y cierra la caja.",
    "Entrega el fondo y comunica cualquier diferencia al rol General.",
  ],
  redes: [
    "Usa el Kit de difusión: copia el texto base y el enlace de la sesión.",
    "Diseña el cartel y publícalo con antelación (fecha, lugar, #DebarockKolektiboa).",
    "Durante la Jam: cobertura audiovisual (fotos/vídeos con permiso).",
    "Post-evento: publica agradecimientos, material y resultados.",
    "Ve marcando en tu lista las tareas completadas de cada paso.",
  ],
};