import type {
  Cancion,
  CierreCaja,
  Evento,
  EstadoTurno,
  Inscripcion,
  MovimientoCaja,
  Propuesta,
  RoleAssignment,
  RolesMap,
  Rol,
  Tarea,
  Turno,
  Usuario,
} from "@/types";

export const DEMO_MES = "2026-10";
export const DEMO_EVENTO_ID = "ev-demo";
export const DEMO_SESSION_KEY = "jam_demo_email";

/** Cuenta dummy de demo: cada email entra con su propio uid y su rol. */
export interface DemoAccount {
  uid: string;
  email: string;
  nombre: string;
  /** null = músico sin roles (solo /mi y material). */
  rol: Rol | null;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { uid: "demo-admin", email: "admin@jam.session", nombre: "Aitor Administración", rol: "admin" },
  { uid: "demo-general", email: "general@jam.session", nombre: "Gabi Coordinación", rol: "general" },
  { uid: "demo-gb", email: "grupo@jam.session", nombre: "Grupo Base", rol: "grupo-base" },
  { uid: "demo-sm", email: "sm@jam.session", nombre: "Sara Escena", rol: "stage-manager" },
  { uid: "demo-tecnico", email: "tecnico@jam.session", nombre: "Tomás Sonido", rol: "tecnico" },
  { uid: "demo-caja", email: "caja@jam.session", nombre: "Rocío Caja", rol: "caja" },
  { uid: "demo-redes", email: "redes@jam.session", nombre: "Nico Difusión", rol: "redes" },
  { uid: "demo-musico", email: "demo@jam.session", nombre: "Músico Demo", rol: null },
];

const ACCOUNTS_BY_EMAIL = new Map(
  DEMO_ACCOUNTS.map((a) => [a.email.toLowerCase(), a]),
);

export function demoAccountFor(
  email?: string | null,
  nombre?: string,
): DemoAccount {
  const key = (email ?? "").trim().toLowerCase();
  const known = ACCOUNTS_BY_EMAIL.get(key);
  if (known) return known;
  return {
    uid: `demo-user-${key || "anon"}`,
    email: key,
    nombre: (nombre ?? "").trim() || key.split("@")[0] || "Músico",
    rol: null,
  };
}

export function demoRolesFor(account: DemoAccount): RolesMap {
  return account.rol ? { [account.rol]: "titular" } : {};
}

export function readDemoSession(): { email: string; nombre?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(DEMO_SESSION_KEY);
  if (!raw) return null;
  if (raw.startsWith("{")) {
    try {
      const parsed = JSON.parse(raw) as { email?: string; nombre?: string };
      if (parsed.email) return { email: parsed.email, nombre: parsed.nombre };
    } catch {
      /* formato antiguo: el valor es el email */
    }
  }
  return { email: raw };
}

export function writeDemoSession(email: string, nombre?: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    DEMO_SESSION_KEY,
    JSON.stringify({ email, nombre }),
  );
}

export function clearDemoSession(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_SESSION_KEY);
}

export function currentDemoAccount(): DemoAccount {
  const session = readDemoSession();
  return demoAccountFor(session?.email, session?.nombre);
}

export function ensureDemoUsuario(store: DemoStore, account: DemoAccount): void {
  if (!account.email) return;
  if (store.usuarios.some((u) => u.uid === account.uid)) return;
  store.usuarios.push({
    uid: account.uid,
    email: account.email,
    nombre: account.nombre,
    telefono: "",
    estado: "activo",
    fechaAlta: new Date().toISOString(),
  });
}

export const DEMO_TASK_TEMPLATES: Record<string, string[]> = {
  admin: [
    "Ejecutar la rotación mensual de roles",
    "Revisar la matriz de usuarios y dar de baja inactivos",
  ],
  general: [
    "Evaluar viabilidad logística y económica de la sesión",
    "Aprobar o rechazar las propuestas de repertorio de los músicos",
    "Crear el Grupo Base del mes y asignar quiénes lo forman",
    "Auditar y recibir los fondos recaudados",
  ],
  "grupo-base": [
    "Revisar las propuestas de la banda para definir el repertorio",
    "Definir el repertorio de apertura y el orden de actuación",
    "Seleccionar el repertorio activo del mes en Drive",
    "Evaluar las solicitudes de los músicos inscritos",
    "Asignar quién toca cada tema en la escaleta",
  ],
  "stage-manager": [
    "Preparar la escaleta base con los turnos",
    "Verificar horarios y duraciones con el Grupo Base",
    "Briefing con los músicos antes de abrir puertas",
  ],
  tecnico: [
    "Revisar la lista de instrumentos confirmados",
    "Planificar micrófonos, líneas y monitores",
    "Comprobar amplificadores y equipo antes del directo",
  ],
  caja: [
    "Preparar el cambio inicial y los precios",
    "Configurar el punto de venta/entrada",
    "Realizar el cuadre de caja al cierre",
  ],
  redes: [
    "Diseñar cartel y portada del mes",
    "Lanzar la campaña de difusión",
    "Cobertura audiovisual durante el evento",
    "Publicar agradecimientos y material post-evento",
  ],
};

export interface DemoStore {
  evento: Evento;
  dataVersion: number;
  catalogo: Cancion[];
  usuarios: Usuario[];
  roles: RoleAssignment[];
  inscripciones: Inscripcion[];
  propuestas: Propuesta[];
  tareas: Tarea[];
  turnos: Turno[];
  movimientos: MovimientoCaja[];
  cierre: CierreCaja | null;
  contador: number;
}

export function demoId(store: DemoStore, prefix: string): string {
  store.contador += 1;
  return `${prefix}-${store.contador}`;
}

export function bumpDemoVersion(store: DemoStore): string {
  store.dataVersion = Date.now();
  return String(store.dataVersion);
}

export function generarTareasDemo(store: DemoStore): number {
  let n = 0;
  for (const [rol, titulos] of Object.entries(DEMO_TASK_TEMPLATES)) {
    for (const titulo of titulos) {
      store.tareas.push({
        id: demoId(store, "t"),
        eventoId: DEMO_EVENTO_ID,
        rol: rol as Tarea["rol"],
        titulo,
        origen: "auto",
        estado: "pendiente",
        creadaPor: "sistema",
        marcadaPor: "",
        marcadaAt: "",
      });
      n += 1;
    }
  }
  return n;
}

export function createDemoStore(): DemoStore {
  const store: DemoStore = {
    evento: {
      id: DEMO_EVENTO_ID,
      titulo: "Jam Session de Octubre",
      mes: DEMO_MES,
      fecha: "2026-10-24",
      hora: "20:30",
      lugar: "Sala El Sótano — C/ Rock 12",
      estado: "aprobado",
      aprobadoPor: "demo-general",
      cartelUrl: "",
    },
    dataVersion: 1,
    catalogo: [],
    usuarios: [],
    roles: [],
    inscripciones: [],
    propuestas: [],
    tareas: [],
    turnos: [],
    movimientos: [],
    cierre: null,
    contador: 100,
  };

  const canciones: [string, string, string][] = [
    ["Sultans of Swing", "Dire Straits", "Dm"],
    ["Come As You Are", "Nirvana", "F#m"],
    ["Valerie", "The Zutons", "Em"],
    ["Superstition", "Stevie Wonder", "Ebm"],
    ["Wonderwall", "Oasis", "F#m"],
    ["Billie Jean", "Michael Jackson", "Fm"],
    ["Lady Madonna", "The Beatles", "F"],
    ["Smooth", "Santana ft. Rob Thomas", "C#m"],
  ];
  store.catalogo = canciones.map(([titulo, artista, tonalidad], i) => ({
    id: `c${i + 1}`,
    titulo,
    artista,
    tonalidad,
    carpetaDriveId: `folder-demo-${i + 1}`,
    estado: "activo",
    origen: i < 6 ? "drive" : "propuesta",
  }));

  store.usuarios = [
    ...DEMO_ACCOUNTS.map((a) => ({
      uid: a.uid,
      email: a.email,
      nombre: a.nombre,
      telefono: "",
      estado: "activo" as const,
      fechaAlta: "2026-09-01T10:00:00.000Z",
    })),
    {
      uid: "u2",
      email: "lucia@banda.test",
      nombre: "Lucía Prado",
      telefono: "600 000 002",
      estado: "activo",
      fechaAlta: "2026-09-02T10:00:00.000Z",
    },
    {
      uid: "u3",
      email: "marcos@banda.test",
      nombre: "Marcos Vidal",
      telefono: "600 000 003",
      estado: "activo",
      fechaAlta: "2026-09-03T10:00:00.000Z",
    },
    {
      uid: "u4",
      email: "nuria@banda.test",
      nombre: "Nuria Sáez",
      telefono: "600 000 004",
      estado: "activo",
      fechaAlta: "2026-09-04T10:00:00.000Z",
    },
    {
      uid: "u5",
      email: "ivan@banda.test",
      nombre: "Iván Costa",
      telefono: "600 000 005",
      estado: "activo",
      fechaAlta: "2026-09-05T10:00:00.000Z",
    },
  ];

  store.roles = [
    ...DEMO_ACCOUNTS.filter((a) => a.rol !== null).map((a) => ({
      mes: DEMO_MES,
      rol: a.rol as Rol,
      uid: a.uid,
      tipo: "titular" as const,
    })),
    { mes: DEMO_MES, rol: "stage-manager" as const, uid: "u2", tipo: "apoyo" },
    { mes: DEMO_MES, rol: "redes" as const, uid: "u4", tipo: "apoyo" },
  ];

  store.inscripciones = [
    {
      id: "ins1",
      eventoId: DEMO_EVENTO_ID,
      uid: "u2",
      nombre: "Lucía Prado",
      instrumentos: ["Voz", "Guitarra"],
      temas: [
        { temaId: "c1", titulo: "Sultans of Swing", instrumento: "Guitarra" },
        { temaId: "c3", titulo: "Valerie", instrumento: "Voz" },
      ],
      estado: "pendiente",
      notas: "Llego 10 min tarde.",
      fecha: "2026-10-05T18:00:00.000Z",
    },
    {
      id: "ins2",
      eventoId: DEMO_EVENTO_ID,
      uid: "u3",
      nombre: "Marcos Vidal",
      instrumentos: ["Bajo"],
      temas: [{ temaId: "c2", titulo: "Come As You Are", instrumento: "Bajo" }],
      estado: "pendiente",
      notas: "",
      fecha: "2026-10-06T19:30:00.000Z",
    },
    {
      id: "ins3",
      eventoId: DEMO_EVENTO_ID,
      uid: "u4",
      nombre: "Nuria Sáez",
      instrumentos: ["Teclado", "Coro"],
      temas: [
        { temaId: "c5", titulo: "Wonderwall", instrumento: "Teclado" },
        { temaId: "c8", titulo: "Smooth", instrumento: "Coro" },
      ],
      estado: "pendiente",
      notas: "Puedo hacer coros en cualquier tema.",
      fecha: "2026-10-07T20:00:00.000Z",
    },
    {
      id: "ins4",
      eventoId: DEMO_EVENTO_ID,
      uid: "u5",
      nombre: "Iván Costa",
      instrumentos: ["Batería"],
      temas: [
        { temaId: "c4", titulo: "Superstition", instrumento: "Batería" },
        { temaId: "c7", titulo: "Lady Madonna", instrumento: "Batería" },
      ],
      estado: "pendiente",
      notas: "",
      fecha: "2026-10-08T21:00:00.000Z",
    },
  ];

  store.propuestas = [
    {
      id: "p1",
      uid: "demo-musico",
      nombre: "Músico Demo",
      cancion: "September",
      artista: "Earth, Wind & Fire",
      instrumento: "Teclado",
      estado: "pendiente",
      fecha: "2026-10-03T12:00:00.000Z",
    },
    {
      id: "p2",
      uid: "demo-musico",
      nombre: "Músico Demo",
      cancion: "Use Somebody",
      artista: "Kings of Leon",
      instrumento: "Guitarra",
      estado: "aprobada",
      fecha: "2026-09-20T12:00:00.000Z",
    },
  ];

  generarTareasDemo(store);
  store.tareas[0].estado = "hecha";
  store.tareas[0].marcadaPor = "demo-admin";
  store.tareas[0].marcadaAt = "2026-10-02T09:00:00.000Z";
  store.tareas[3].estado = "hecha";
  store.tareas[3].marcadaPor = "demo-general";
  store.tareas[3].marcadaAt = "2026-10-04T11:00:00.000Z";
  store.tareas.push({
    id: demoId(store, "t"),
    eventoId: DEMO_EVENTO_ID,
    rol: "redes",
    titulo: "Colgar el cartel en Instagram y Stories",
    origen: "personal",
    estado: "pendiente",
    creadaPor: "demo-redes",
    marcadaPor: "",
    marcadaAt: "",
  });

  const turno = (
    orden: number,
    titulo: string,
    interpretes: string,
    estado: EstadoTurno,
  ): Turno => ({
    id: demoId(store, "sc"),
    eventoId: DEMO_EVENTO_ID,
    orden,
    temaId: "",
    titulo,
    interpretes,
    estado,
    duracionEst: "8 min",
    updatedAt: "",
    updatedBy: "",
  });
  store.turnos = [
    turno(1, "Sultans of Swing", "Lucía Prado (voz/guitarra), Marcos Vidal (bajo)", "fin"),
    turno(2, "Come As You Are", "Iván Costa (batería), Marcos Vidal (bajo)", "fin"),
    turno(3, "Valerie", "Lucía Prado (voz), Nuria Sáez (teclado)", "escena"),
    turno(4, "Wonderwall", "Nuria Sáez (teclado), coros abiertos", "espera"),
    turno(5, "Cierre jam — jam abierta", "Todos", "espera"),
  ];

  const mov = (
    tipo: MovimientoCaja["tipo"],
    concepto: string,
    importe: number,
    metodo: string,
  ): MovimientoCaja => ({
    id: demoId(store, "m"),
    eventoId: DEMO_EVENTO_ID,
    tipo,
    concepto,
    importe,
    metodo,
    uid: "u2",
    fecha: "2026-10-24T20:45:00.000Z",
    nota: "",
  });
  store.movimientos = [
    mov("entrada", "Entrada anticipada", 5, "efectivo"),
    mov("entrada", "Entrada en taquilla", 5, "efectivo"),
    mov("entrada", "Entrada en taquilla", 5, "tarjeta"),
    mov("entrada", "Entrada anticipada", 5, "efectivo"),
    mov("consumible", "Cerveza", 2.5, "efectivo"),
    mov("consumible", "Refresco", 1.5, "efectivo"),
    mov("consumible", "Cerveza", 2.5, "efectivo"),
    mov("consumible", "Agua", 1, "tarjeta"),
    mov("otro", "Propina banda", 8, "efectivo"),
  ];

  return store;
}

let storeSingleton: DemoStore | null = null;

export function demoStore(): DemoStore {
  if (!storeSingleton) storeSingleton = createDemoStore();
  return storeSingleton;
}

/** Snapshot para render estáctico en el servidor (vista pública). */
export function demoPublicSnapshot(): {
  evento: Evento;
  catalogo: Cancion[];
  dataVersion: string;
} {
  const s = createDemoStore();
  return {
    evento: s.evento,
    catalogo: s.catalogo,
    dataVersion: String(s.dataVersion),
  };
}

export function demoSvgBase64(texto: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1100" viewBox="0 0 800 1100">` +
    `<rect width="800" height="1100" fill="#fff"/>` +
    `<rect x="40" y="40" width="720" height="1020" fill="none" stroke="#ddd" stroke-width="4"/>` +
    `<text x="400" y="120" font-family="Arial" font-size="42" font-weight="bold" text-anchor="middle" fill="#111">${escapeXml(texto)}</text>` +
    `<text x="400" y="560" font-family="Arial" font-size="28" text-anchor="middle" fill="#888">Material de demostración</text>` +
    `<text x="400" y="610" font-family="Arial" font-size="22" text-anchor="middle" fill="#bbb">Sustituye por los archivos reales de Drive</text>` +
    `</svg>`;
  const bytes = new TextEncoder().encode(svg);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
