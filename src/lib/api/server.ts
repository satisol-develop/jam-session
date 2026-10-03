import { buildPayload } from "@/lib/api/signer";
import { DEMO_MODE } from "@/lib/demo";
import { demoPublicSnapshot } from "@/lib/demo/data";
import type { EventoPublico, GsEnvelope } from "@/types";

const REVALIDATE_SECONDS = 300;

/** Llamada firmada al Apps Script desde el servidor (sin pasar por el BFF). */
export async function callGs<T = unknown>(
  route: string,
  body?: unknown,
  uid = "",
): Promise<GsEnvelope<T>> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) {
    return { ok: false, error: "Faltan APPS_SCRIPT_URL o APPS_SCRIPT_SECRET." };
  }
  try {
    const payload = buildPayload({ route, body, secret, uid });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      cache: "no-store",
    });
    return (await res.json()) as GsEnvelope<T>;
  } catch {
    return { ok: false, error: "No se pudo contactar con el Apps Script." };
  }
}

export async function fetchPublicEvent(): Promise<EventoPublico | null> {
  if (DEMO_MODE) return demoPublicSnapshot();

  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) return null;

  try {
    const payload = buildPayload({ route: "public.event", secret });
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      next: { revalidate: REVALIDATE_SECONDS },
    });
    const json = (await res.json()) as GsEnvelope<EventoPublico>;
    if (!json.ok || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}
