"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { DEMO_MODE } from "@/lib/demo";
import { demoApi } from "@/lib/demo/api";
import { fmt, getDict, localeActual } from "@/i18n";
import type { GsEnvelope } from "@/types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Rutas de solo lectura: candidatas a caché corta y dedupe en vuelo. */
const RUTAS_LECTURA: ReadonlySet<string> = new Set([
  "admin.audit",
  "admin.history",
  "admin.users",
  "cash.list",
  "escaleta.list",
  "event.inscripciones",
  "material.list",
  "musician.attendees",
  "musician.myProposals",
  "musician.subscription",
  "plantilla.list",
  "proposal.list",
  "public.catalog",
  "public.event",
  "task.list",
]);

/** Las lecturas se reutilizan 30 s: dos pantallas que piden lo mismo (o un
 *  doble mount en StrictMode) disparan un solo viaje a Apps Script. */
const TTL_LECTURAS_MS = 30_000;

interface EntradaLectura {
  promesa: Promise<unknown>;
  ts: number;
}

const lecturas = new Map<string, EntradaLectura>();
const enVuelo = new Map<string, Promise<unknown>>();

/** Vacía el caché de lecturas (tras mutaciones y al cerrar sesión). */
export function invalidarLecturas() {
  lecturas.clear();
}

/**
 * Llamada directa al Apps Script (GitHub Pages no tiene servidor propio).
 * POST con Content-Type text/simple (sin preflight CORS): el ID token de
 * Firebase viaja en el body y lo verifica el backend con accounts:lookup.
 */
export async function api<T = unknown>(route: string, body?: unknown): Promise<T> {
  const cacheable = RUTAS_LECTURA.has(route);
  // `user.me` solo se deduplica (sin TTL): dos montajes simultáneos comparten
  // el viaje, pero el refresco siempre va a la red.
  const dedupe = cacheable || route === "user.me";

  if (!dedupe) {
    // Mutaciones: nunca se cachean y vacían el caché de lecturas para no
    // servir datos obsoletos (p. ej. tras guardar una inscripción).
    return apiSinCache<T>(route, body).then((dato) => {
      lecturas.clear();
      return dato;
    });
  }

  const clave = `${route}:${JSON.stringify(body ?? null)}`;
  const guardada = lecturas.get(clave);
  if (guardada && Date.now() - guardada.ts < TTL_LECTURAS_MS) {
    return guardada.promesa as Promise<T>;
  }
  const pendiente = enVuelo.get(clave);
  if (pendiente) return pendiente as Promise<T>;

  const p = apiSinCache<T>(route, body)
    .then((dato) => {
      if (cacheable) {
        lecturas.set(clave, { promesa: Promise.resolve(dato), ts: Date.now() });
      }
      return dato;
    })
    .finally(() => {
      enVuelo.delete(clave);
    });
  enVuelo.set(clave, p);
  return p;
}

async function apiSinCache<T = unknown>(route: string, body?: unknown): Promise<T> {
  const d = getDict(localeActual()).errores;
  if (DEMO_MODE) {
    try {
      return await demoApi<T>(route, body);
    } catch (err) {
      throw new ApiError(
        err instanceof Error ? err.message : d.desconocido,
        400,
      );
    }
  }

  const url = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
  if (!url) {
    throw new ApiError(
      "Falta NEXT_PUBLIC_APPS_SCRIPT_URL en el entorno del build.",
      0,
    );
  }

  const auth = getFirebaseAuth();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        route,
        body,
        token,
        origin: window.location.origin,
      }),
      redirect: "follow",
      cache: "no-store",
      // Tope de 30 s: sin él, un Apps Script colgado deja la pantalla en
      // «cargando» para siempre. En el error se nombra la ruta para saber
      // cuál fue la que no respondió.
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new ApiError(
        fmt(d.sinRespuesta, { ruta: route }),
        0,
      );
    }
    throw new ApiError(d.red, 0);
  }

  const envelope = (await res.json().catch(() => null)) as GsEnvelope<T> | null;
  if (!envelope) {
    throw new ApiError(d.servidor, res.status);
  }
  if (!envelope.ok) {
    throw new ApiError(envelope.error ?? d.desconocido, res.status);
  }
  return envelope.data as T;
}
