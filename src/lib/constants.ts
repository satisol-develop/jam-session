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
    description: "Matriz de usuarios y rotación mensual de roles.",
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
    description: "Carteles, difusión, cobertura audiovisual y post-evento.",
  },
};
