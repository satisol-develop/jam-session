import type {
  Cancion,
  CierreCaja,
  Evento,
  Inscripcion,
  MovimientoCaja,
  RoleAssignment,
  RolesMap,
  Rol,
  Tarea,
  TipoMovimiento,
  Turno,
  Usuario,
} from "@/types";
import {
  DEMO_EVENTO_ID,
  DEMO_MES,
  DEMO_ROLES,
  DEMO_UID,
  bumpDemoVersion,
  demoId,
  demoStore,
  demoSvgBase64,
  generarTareasDemo,
} from "./data";

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validarTitular(rol: Rol): void {
  if (DEMO_ROLES[rol] !== "titular") {
    throw new Error(`Permiso denegado: no eres titular del rol ${rol}.`);
  }
}

function totalesDemo(movimientos: MovimientoCaja[]) {
  const totales = { entradas: 0, consumibles: 0, otros: 0 };
  for (const m of movimientos) {
    if (m.tipo === "entrada") totales.entradas += m.importe;
    else if (m.tipo === "consumible") totales.consumibles += m.importe;
    else totales.otros += m.importe;
  }
  return totales;
}

export async function demoApi<T>(route: string, body?: unknown): Promise<T> {
  await delay();
  const b = (body ?? {}) as Record<string, unknown>;
  const s = demoStore();

  switch (route) {
    case "public.event":
      return {
        evento: s.evento,
        catalogo: s.catalogo,
        dataVersion: String(s.dataVersion),
      } as T;

    case "public.catalog":
      return {
        catalogo: s.catalogo,
        dataVersion: String(s.dataVersion),
      } as T;

    case "user.create":
      return { uid: DEMO_UID } as T;

    case "user.me":
      return { usuario: s.usuarios[0], roles: DEMO_ROLES } as T;

    case "musician.subscription":
      return {
        eventoId: DEMO_EVENTO_ID,
        inscripcion: s.inscripciones.find((i) => i.uid === DEMO_UID) ?? null,
      } as T;

    case "musician.subscribe": {
      const instrumentos = Array.isArray(b.instrumentos)
        ? (b.instrumentos as string[])
        : [];
      const temas = Array.isArray(b.temas)
        ? (b.temas as Inscripcion["temas"])
        : [];
      if (instrumentos.length === 0) {
        throw new Error("Selecciona al menos un instrumento.");
      }
      if (temas.length === 0) throw new Error("Selecciona al menos un tema.");

      const existente = s.inscripciones.find((i) => i.uid === DEMO_UID);
      const guardada: Inscripcion = {
        id: existente?.id ?? demoId(s, "ins"),
        eventoId: DEMO_EVENTO_ID,
        uid: DEMO_UID,
        nombre: s.usuarios[0]?.nombre ?? "Músico Demo",
        instrumentos,
        temas,
        estado: existente?.estado ?? "pendiente",
        notas: String(b.notas ?? ""),
        fecha: existente?.fecha ?? new Date().toISOString(),
      };
      if (existente) {
        Object.assign(existente, guardada);
      } else {
        s.inscripciones.push(guardada);
      }
      bumpDemoVersion(s);
      return guardada as T;
    }

    case "musician.propose": {
      const texto = String(b.texto ?? "").trim();
      if (texto.length < 3) throw new Error("La propuesta es demasiado corta.");
      const propuesta = {
        id: demoId(s, "p"),
        uid: DEMO_UID,
        nombre: s.usuarios[0]?.nombre ?? "",
        texto,
        estado: "pendiente" as const,
        fecha: new Date().toISOString(),
      };
      s.propuestas.unshift(propuesta);
      bumpDemoVersion(s);
      return { id: propuesta.id } as T;
    }

    case "musician.myProposals":
      return {
        propuestas: s.propuestas.filter((p) => p.uid === DEMO_UID),
      } as T;

    case "musician.attendees": {
      const vistos = new Map<string, string>();
      for (const i of s.inscripciones) {
        if (i.eventoId === DEMO_EVENTO_ID) vistos.set(i.uid, i.nombre);
      }
      return {
        eventoId: DEMO_EVENTO_ID,
        usuarios: Array.from(vistos, ([uid, nombre]) => ({ uid, nombre })),
      } as T;
    }

    case "event.inscripciones":
      return {
        eventoId: DEMO_EVENTO_ID,
        inscripciones: s.inscripciones,
      } as T;

    case "musician.setEstado": {
      validarTitular("grupo-base");
      const ins = s.inscripciones.find((i) => i.id === String(b.id ?? ""));
      if (!ins) throw new Error("Inscripción no encontrada.");
      const estado = String(b.estado ?? "");
      if (!["pendiente", "asignado", "parcial", "rechazado"].includes(estado)) {
        throw new Error("Estado inválido.");
      }
      ins.estado = estado as Inscripcion["estado"];
      bumpDemoVersion(s);
      return ins as T;
    }

    case "proposal.list":
      return { propuestas: s.propuestas } as T;

    case "proposal.resolve": {
      validarTitular("general");
      const propuesta = s.propuestas.find((x) => x.id === String(b.id ?? ""));
      if (!propuesta) throw new Error("Propuesta no encontrada.");
      const estado = String(b.estado ?? "");
      if (estado !== "aprobada" && estado !== "rechazada") {
        throw new Error("Estado inválido.");
      }
      propuesta.estado = estado;
      bumpDemoVersion(s);
      return propuesta as T;
    }

    case "material.list": {
      const cancion = s.catalogo.find(
        (c) => c.carpetaDriveId === String(b.carpetaDriveId ?? ""),
      );
      if (!cancion) throw new Error("Carpeta fuera del catálogo.");
      return {
        archivos: [
          {
            id: `${cancion.id}-f1`,
            nombre: `${cancion.titulo} — cifrado.svg`,
            mimeType: "image/svg+xml",
          },
          {
            id: `${cancion.id}-f2`,
            nombre: `${cancion.titulo} — partitura.svg`,
            mimeType: "image/svg+xml",
          },
        ],
      } as T;
    }

    case "material.file": {
      const fileId = String(b.fileId ?? "");
      const [songId, fileIdx] = fileId.split("-");
      const cancion = s.catalogo.find((c) => c.id === songId);
      if (!cancion) throw new Error("Archivo fuera del catálogo.");
      const tipo = fileIdx === "f2" ? "Partitura" : "Cifrado";
      return {
        id: fileId,
        nombre: `${cancion.titulo} — ${tipo.toLowerCase()}.svg`,
        mimeType: "image/svg+xml",
        base64: demoSvgBase64(`${cancion.titulo} — ${tipo}`),
      } as T;
    }

    case "task.list":
      return { eventoId: DEMO_EVENTO_ID, tareas: s.tareas } as T;

    case "task.add": {
      const rol = String(b.rol ?? "") as Rol;
      const rolesValidos: Rol[] = [
        "admin",
        "general",
        "grupo-base",
        "stage-manager",
        "tecnico",
        "caja",
        "redes",
      ];
      if (!rolesValidos.includes(rol)) throw new Error("Rol inválido.");
      validarTitular(rol);
      const titulo = String(b.titulo ?? "").trim();
      if (titulo.length < 3) throw new Error("La tarea es demasiado corta.");
      const tarea: Tarea = {
        id: demoId(s, "t"),
        eventoId: DEMO_EVENTO_ID,
        rol,
        titulo,
        origen: "personal",
        estado: "pendiente",
        creadaPor: DEMO_UID,
        marcadaPor: "",
        marcadaAt: "",
      };
      s.tareas.push(tarea);
      bumpDemoVersion(s);
      return tarea as T;
    }

    case "task.toggle": {
      const tarea = s.tareas.find((t) => t.id === String(b.taskId ?? ""));
      if (!tarea) throw new Error("Tarea no encontrada.");
      validarTitular(tarea.rol);
      if (tarea.estado === "hecha") {
        tarea.estado = "pendiente";
        tarea.marcadaPor = "";
        tarea.marcadaAt = "";
      } else {
        tarea.estado = "hecha";
        tarea.marcadaPor = DEMO_UID;
        tarea.marcadaAt = new Date().toISOString();
      }
      bumpDemoVersion(s);
      return tarea as T;
    }

    case "escaleta.list":
      return {
        eventoId: DEMO_EVENTO_ID,
        dataVersion: String(s.dataVersion),
        turnos: s.turnos,
      } as T;

    case "escaleta.save": {
      const turnos = Array.isArray(b.turnos) ? (b.turnos as Turno[]) : [];
      if (turnos.length > 100) throw new Error("Demasiados turnos.");
      s.turnos = turnos.map((t, i) => ({
        ...t,
        id: t.id.startsWith("local-") ? demoId(s, "sc") : t.id,
        eventoId: DEMO_EVENTO_ID,
        orden: i + 1,
        estado:
          t.estado === "escena" || t.estado === "fin" ? t.estado : "espera",
        updatedAt: new Date().toISOString(),
        updatedBy: DEMO_UID,
      }));
      bumpDemoVersion(s);
      return {
        eventoId: DEMO_EVENTO_ID,
        dataVersion: String(s.dataVersion),
        turnos: s.turnos,
      } as T;
    }

    case "cash.list":
      return {
        eventoId: DEMO_EVENTO_ID,
        movimientos: s.movimientos,
        totales: totalesDemo(s.movimientos),
        cierre: s.cierre,
      } as T;

    case "cash.add": {
      const tipo = String(b.tipo ?? "");
      if (!["entrada", "consumible", "otro"].includes(tipo)) {
        throw new Error("Tipo de movimiento inválido.");
      }
      const importe = Number(
        typeof b.importe === "string" ? b.importe.replace(",", ".") : b.importe,
      );
      if (!importe || Number.isNaN(importe)) throw new Error("Importe inválido.");
      if (s.cierre) throw new Error("La caja ya está cerrada.");
      const movimiento: MovimientoCaja = {
        id: demoId(s, "m"),
        eventoId: DEMO_EVENTO_ID,
        tipo: tipo as TipoMovimiento,
        concepto: String(b.concepto ?? "").slice(0, 120),
        importe,
        metodo: b.metodo === "tarjeta" ? "tarjeta" : "efectivo",
        uid: DEMO_UID,
        fecha: new Date().toISOString(),
        nota: "",
      };
      s.movimientos.unshift(movimiento);
      bumpDemoVersion(s);
      return movimiento as T;
    }

    case "cash.delete": {
      const idx = s.movimientos.findIndex((m) => m.id === String(b.id ?? ""));
      if (idx < 0) throw new Error("Movimiento no encontrado.");
      if (s.cierre) throw new Error("La caja ya está cerrada.");
      s.movimientos.splice(idx, 1);
      bumpDemoVersion(s);
      return { id: String(b.id) } as T;
    }

    case "cash.close": {
      validarTitular("caja");
      const fondoInicial =
        Number(
          typeof b.fondoInicial === "string"
            ? b.fondoInicial.replace(",", ".")
            : b.fondoInicial,
        ) || 0;
      const efectivoContado =
        Number(
          typeof b.efectivoContado === "string"
            ? b.efectivoContado.replace(",", ".")
            : b.efectivoContado,
        ) || 0;
      const cobradoEfectivo = s.movimientos
        .filter((m) => m.metodo === "efectivo")
        .reduce((sum, m) => sum + m.importe, 0);
      const cierre: CierreCaja = {
        fondoInicial,
        efectivoContado,
        cobradoEfectivo,
        esperadoEnCaja: fondoInicial + cobradoEfectivo,
        diferencia: efectivoContado - (fondoInicial + cobradoEfectivo),
        cerradoPor: DEMO_UID,
        cerradoAt: new Date().toISOString(),
      };
      s.cierre = cierre;
      bumpDemoVersion(s);
      return cierre as T;
    }

    case "admin.users":
      return {
        mes: DEMO_MES,
        usuarios: s.usuarios,
        roles: s.roles.filter((r) => r.mes === DEMO_MES),
      } as T;

    case "admin.rotate": {
      validarTitular("admin");
      const mes = String(b.mes ?? "");
      if (!/^\d{4}-\d{2}$/.test(mes)) throw new Error("Mes inválido (usa yyyy-MM).");
      const nuevas = (Array.isArray(b.asignaciones)
        ? b.asignaciones
        : []) as RoleAssignment[];
      const anteriores = s.roles.filter((r) => r.mes === mes);
      s.roles = [
        ...s.roles.filter((r) => r.mes !== mes),
        ...nuevas.map((a) => ({ ...a, mes })),
      ];
      bumpDemoVersion(s);
      return { mes, asignaciones: nuevas, anteriores } as T;
    }

    case "general.approve": {
      validarTitular("general");
      if (s.evento.estado === "aprobado") {
        throw new Error("El evento ya está aprobado.");
      }
      s.evento = {
        ...s.evento,
        estado: "aprobado",
        aprobadoPor: DEMO_UID,
      };
      const generadas = generarTareasDemo(s);
      bumpDemoVersion(s);
      return { eventoId: DEMO_EVENTO_ID, tareasGeneradas: generadas } as T;
    }

    default:
      throw new Error(`Ruta no disponible en modo demo: ${route}`);
  }
}

export type { Evento, Usuario, RolesMap, Cancion };
