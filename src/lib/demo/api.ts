import type {
  Cancion,
  CierreCaja,
  Evento,
  Inscripcion,
  MovimientoCaja,
  ResumenCaja,
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
  bumpDemoVersion,
  currentDemoAccount,
  demoAccountFor,
  demoId,
  demoRolesFor,
  demoStore,
  demoSvgBase64,
  ensureDemoUsuario,
  generarTareasDemo,
  readDemoSession,
  type DemoStore,
} from "./data";

function delay(ms = 180): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** El evento cerrado (realizado) congela la operativa. */
function requiereEventoAbierto(s: DemoStore): void {
  if (s.evento.estado === "realizado") {
    throw new Error("El evento está cerrado (realizado): operativa congelada.");
  }
}

function validarTitular(rol: Rol): void {
  const roles = demoRolesFor(currentDemoAccount());
  if (roles[rol] !== "titular") {
    throw new Error(`Permiso denegado: no eres titular del rol ${rol}.`);
  }
}

function validarTitularAlguno(listado: Rol[]): void {
  const roles = demoRolesFor(currentDemoAccount());
  if (!listado.some((rol) => roles[rol] === "titular")) {
    throw new Error(
      `Permiso denegado: requiere ser titular de ${listado.join(" / ")}.`,
    );
  }
}

function totalesDemo(movimientos: MovimientoCaja[]): ResumenCaja["totales"] {
  const totales = { consumibles: 0, otros: 0, gastos: 0, beneficio: 0 };
  for (const m of movimientos) {
    if (m.tipo === "consumible") totales.consumibles += m.importe;
    else if (m.tipo === "gasto") totales.gastos += m.importe;
    else totales.otros += m.importe;
  }
  totales.beneficio = totales.consumibles + totales.otros - totales.gastos;
  return totales;
}

export async function demoApi<T>(route: string, body?: unknown): Promise<T> {
  await delay();
  const b = (body ?? {}) as Record<string, unknown>;
  const s = demoStore();
  const session = readDemoSession();
  const acc = session ? demoAccountFor(session.email, session.nombre) : null;
  if (acc) ensureDemoUsuario(s, acc);
  const uid = acc?.uid ?? "";
  const nombre = acc?.nombre ?? "Músico Demo";

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
      return { uid: uid || `demo-user-${Date.now()}` } as T;

    case "user.me":
      return {
        usuario:
          s.usuarios.find((u) => u.uid === uid) ??
          ({
            uid,
            email: acc?.email ?? "",
            nombre,
            telefono: "",
            estado: "activo",
            fechaAlta: new Date().toISOString(),
          } as Usuario),
        roles: demoRolesFor(acc ?? demoAccountFor("")),
      } as T;

    case "musician.subscription":
      return {
        eventoId: DEMO_EVENTO_ID,
        inscripcion: s.inscripciones.find((i) => i.uid === uid) ?? null,
      } as T;

    case "musician.subscribe": {
      requiereEventoAbierto(s);
      if (s.evento.inscripcionesCerradas) {
        throw new Error(
          s.evento.ensayo
            ? `Inscripciones cerradas. Ensayo general: ${s.evento.ensayo}`
            : "Inscripciones cerradas por el Grupo Base.",
        );
      }
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

      const existente = s.inscripciones.find((i) => i.uid === uid);
      const guardada: Inscripcion = {
        id: existente?.id ?? demoId(s, "ins"),
        eventoId: DEMO_EVENTO_ID,
        uid,
        nombre,
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
      requiereEventoAbierto(s);
      const cancion = String(b.cancion ?? "").trim();
      const artista = String(b.artista ?? "").trim();
      const instrumento = String(b.instrumento ?? "").trim();
      if (cancion.length < 2) throw new Error("Indica el título de la canción.");
      if (instrumento.length < 2) {
        throw new Error("Indica el instrumento con el que la tocarías.");
      }
      const propuesta = {
        id: demoId(s, "p"),
        uid,
        nombre,
        cancion,
        artista,
        instrumento,
        estado: "pendiente" as const,
        fecha: new Date().toISOString(),
      };
      s.propuestas.unshift(propuesta);
      bumpDemoVersion(s);
      return { id: propuesta.id } as T;
    }

    case "musician.myProposals":
      return {
        propuestas: s.propuestas.filter((p) => p.uid === uid),
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
      requiereEventoAbierto(s);
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
      requiereEventoAbierto(s);
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
      requiereEventoAbierto(s);
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
        creadaPor: uid,
        marcadaPor: "",
        marcadaAt: "",
        subtareas: [],
      };
      s.tareas.push(tarea);
      bumpDemoVersion(s);
      return tarea as T;
    }

    case "task.subtask.add": {
      const tarea = s.tareas.find((t) => t.id === String(b.taskId ?? ""));
      if (!tarea) throw new Error("Tarea no encontrada.");
      requiereEventoAbierto(s);
      validarTitular(tarea.rol);
      const titulo = String(b.titulo ?? "").trim();
      if (titulo.length < 3) throw new Error("La subtarea es demasiado corta.");
      const subtarea = { id: demoId(s, "sub"), titulo, hecha: false };
      tarea.subtareas = [...(tarea.subtareas ?? []), subtarea];
      bumpDemoVersion(s);
      return tarea as T;
    }

    case "task.subtask.toggle": {
      const tarea = s.tareas.find((t) => t.id === String(b.taskId ?? ""));
      if (!tarea) throw new Error("Tarea no encontrada.");
      requiereEventoAbierto(s);
      validarTitular(tarea.rol);
      const subtarea = (tarea.subtareas ?? []).find(
        (st) => st.id === String(b.subtaskId ?? ""),
      );
      if (!subtarea) throw new Error("Subtarea no encontrada.");
      subtarea.hecha = !subtarea.hecha;
      bumpDemoVersion(s);
      return tarea as T;
    }

    case "task.toggle": {
      const tarea = s.tareas.find((t) => t.id === String(b.taskId ?? ""));
      if (!tarea) throw new Error("Tarea no encontrada.");
      requiereEventoAbierto(s);
      validarTitular(tarea.rol);
      if (tarea.estado === "hecha") {
        tarea.estado = "pendiente";
        tarea.marcadaPor = "";
        tarea.marcadaAt = "";
      } else {
        tarea.estado = "hecha";
        tarea.marcadaPor = uid;
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
      requiereEventoAbierto(s);
      validarTitularAlguno(["stage-manager", "grupo-base"]);
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
        updatedBy: uid,
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
      requiereEventoAbierto(s);
      validarTitular("caja");
      const tipo = String(b.tipo ?? "");
      if (!["consumible", "otro", "gasto"].includes(tipo)) {
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
        uid,
        fecha: new Date().toISOString(),
        nota: "",
      };
      s.movimientos.unshift(movimiento);
      bumpDemoVersion(s);
      return movimiento as T;
    }

    case "cash.delete": {
      requiereEventoAbierto(s);
      validarTitular("caja");
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
        .reduce(
          (sum, m) => sum + (m.tipo === "gasto" ? -m.importe : m.importe),
          0,
        );
      const cierre: CierreCaja = {
        eventoId: DEMO_EVENTO_ID,
        fondoInicial,
        efectivoContado,
        cobradoEfectivo,
        esperadoEnCaja: fondoInicial + cobradoEfectivo,
        diferencia: efectivoContado - (fondoInicial + cobradoEfectivo),
        cerradoPor: uid,
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

    case "event.update": {
      validarTitular("general");
      requiereEventoAbierto(s);
      if (b.titulo !== undefined) s.evento.titulo = String(b.titulo).slice(0, 120);
      if (b.fecha !== undefined) s.evento.fecha = String(b.fecha).slice(0, 40);
      if (b.hora !== undefined) s.evento.hora = String(b.hora).slice(0, 20);
      if (b.lugar !== undefined) s.evento.lugar = String(b.lugar).slice(0, 160);
      bumpDemoVersion(s);
      return { evento: s.evento } as T;
    }

    case "event.close": {
      validarTitular("general");
      if (s.evento.estado !== "aprobado") {
        throw new Error("Solo se puede cerrar un evento aprobado.");
      }
      s.evento = { ...s.evento, estado: "realizado" };
      bumpDemoVersion(s);
      return { evento: s.evento } as T;
    }

    case "event.setEnsayo": {
      validarTitular("grupo-base");
      requiereEventoAbierto(s);
      s.evento.ensayo = String(b.ensayo ?? "").slice(0, 40);
      bumpDemoVersion(s);
      return { evento: s.evento } as T;
    }

    case "event.setInscripciones": {
      validarTitular("grupo-base");
      requiereEventoAbierto(s);
      s.evento.inscripcionesCerradas = b.cerradas === true;
      bumpDemoVersion(s);
      return { evento: s.evento } as T;
    }

    case "general.approve": {
      validarTitular("general");
      if (s.evento.estado !== "borrador") {
        throw new Error("El evento no está en borrador (ya aprobado o cerrado).");
      }
      s.evento = {
        ...s.evento,
        estado: "aprobado",
        aprobadoPor: uid,
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
