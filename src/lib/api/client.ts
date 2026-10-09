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

/**
 * Llamada directa al Apps Script (GitHub Pages no tiene servidor propio).
 * POST con Content-Type text/simple (sin preflight CORS): el ID token de
 * Firebase viaja en el body y lo verifica el backend con accounts:lookup.
 */
export async function api<T = unknown>(route: string, body?: unknown): Promise<T> {
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
