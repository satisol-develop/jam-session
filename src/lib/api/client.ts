"use client";

import { getFirebaseAuth } from "@/lib/firebase/client";
import { DEMO_MODE } from "@/lib/demo";
import { demoApi } from "@/lib/demo/api";
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
  if (DEMO_MODE) {
    try {
      return await demoApi<T>(route, body);
    } catch (err) {
      throw new ApiError(
        err instanceof Error ? err.message : "Error desconocido.",
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
    });
  } catch {
    throw new ApiError("Error de red. Comprueba tu conexión.", 0);
  }

  const envelope = (await res.json().catch(() => null)) as GsEnvelope<T> | null;
  if (!envelope) {
    throw new ApiError("Respuesta inválida del servidor.", res.status);
  }
  if (!envelope.ok) {
    throw new ApiError(envelope.error ?? "Error desconocido.", res.status);
  }
  return envelope.data as T;
}
