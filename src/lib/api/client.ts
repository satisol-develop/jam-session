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

  const auth = getFirebaseAuth();
  const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

  let res: Response;
  try {
    res = await fetch("/api/gs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ route, body }),
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
