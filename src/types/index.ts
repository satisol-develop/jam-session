export const ROLES = [
  "admin",
  "general",
  "grupo-base",
  "stage-manager",
  "tecnico",
  "caja",
  "redes",
] as const;

export type Rol = (typeof ROLES)[number];
export type TipoRol = "titular" | "apoyo";
export type RolesMap = Partial<Record<Rol, TipoRol>>;

export interface RoleAssignment {
  mes: string;
  rol: Rol;
  uid: string;
  tipo: TipoRol;
}

export type EstadoEvento = "borrador" | "aprobado" | "realizado";

export interface Evento {
  id: string;
  titulo: string;
  mes: string;
  fecha: string;
  hora: string;
  lugar: string;
  estado: EstadoEvento;
  aprobadoPor: string;
  cartelUrl: string;
}

export type EstadoCancion = "activo" | "inactivo";

export interface Cancion {
  id: string;
  titulo: string;
  artista: string;
  tonalidad: string;
  carpetaDriveId: string;
  estado: EstadoCancion;
  origen: "drive" | "propuesta";
}

export type EstadoUsuario = "activo" | "baja";

export interface Usuario {
  uid: string;
  email: string;
  nombre: string;
  telefono: string;
  estado: EstadoUsuario;
  fechaAlta: string;
}

export type EstadoInscripcion = "pendiente" | "asignado" | "parcial" | "rechazado";

export interface SolicitudTema {
  temaId: string;
  titulo: string;
  instrumento: string;
}

export interface Inscripcion {
  id: string;
  eventoId: string;
  uid: string;
  nombre: string;
  instrumentos: string[];
  temas: SolicitudTema[];
  estado: EstadoInscripcion;
  notas: string;
  fecha: string;
}

export type EstadoPropuesta = "pendiente" | "aprobada" | "rechazada";

export interface Propuesta {
  id: string;
  uid: string;
  nombre: string;
  texto: string;
  estado: EstadoPropuesta;
  fecha: string;
}

export type EstadoTurno = "espera" | "escena" | "fin";

export interface Turno {
  id: string;
  eventoId: string;
  orden: number;
  temaId: string;
  titulo: string;
  interpretes: string;
  estado: EstadoTurno;
  duracionEst: string;
  updatedAt: string;
  updatedBy: string;
}

export type EstadoTarea = "pendiente" | "hecha";
export type OrigenTarea = "auto" | "personal";

export interface Tarea {
  id: string;
  eventoId: string;
  rol: Rol;
  titulo: string;
  origen: OrigenTarea;
  estado: EstadoTarea;
  creadaPor: string;
  marcadaPor: string;
  marcadaAt: string;
}

export type TipoMovimiento = "entrada" | "consumible" | "otro";

export interface MovimientoCaja {
  id: string;
  eventoId: string;
  tipo: TipoMovimiento;
  concepto: string;
  importe: number;
  metodo: string;
  uid: string;
  fecha: string;
  nota: string;
}

export interface CierreCaja {
  fondoInicial: number;
  efectivoContado: number;
  esperadoEnCaja: number;
  diferencia: number;
  cobradoEfectivo: number;
  cerradoPor: string;
  cerradoAt: string;
}

export interface ResumenCaja {
  eventoId: string;
  movimientos: MovimientoCaja[];
  totales: { entradas: number; consumibles: number; otros: number };
  cierre: CierreCaja | null;
}

export interface ItemCatalogoDrive {
  id: string;
  titulo: string;
  artista: string;
  carpetaDriveId: string;
  archivos: { id: string; nombre: string; mimeType: string }[];
}

export interface EventoPublico {
  evento: Evento | null;
  catalogo: Cancion[];
  dataVersion: string;
}

export interface Asistentes {
  usuarios: Usuario[];
}

export interface GsPayload {
  route: string;
  uid: string;
  ts: number;
  body: string;
  sig: string;
}

export interface GsEnvelope<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}
