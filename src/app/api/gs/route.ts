import { NextRequest, NextResponse } from "next/server";
import { buildPayload, PUBLIC_ROUTES } from "@/lib/api/signer";
import { verifyIdToken } from "@/lib/firebase/admin";
import type { GsEnvelope } from "@/types";

type Ctx =
  | { ok: true; route: string; uid: string; body?: unknown }
  | { ok: false; error: string; status: number };

function bearerToken(header: string | null): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

async function callAppsScript(
  route: string,
  uid: string,
  body: unknown,
): Promise<NextResponse<GsEnvelope>> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.APPS_SCRIPT_SECRET;
  if (!url || !secret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Faltan APPS_SCRIPT_URL o APPS_SCRIPT_SECRET en el entorno del servidor.",
      },
      { status: 503 },
    );
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
    const data = (await res.json()) as GsEnvelope;
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json(
      { ok: false, error: "No se pudo contactar con el Apps Script." },
      { status: 502 },
    );
  }
}

function errorResponse(ctx: Extract<Ctx, { ok: false }>) {
  return NextResponse.json({ ok: false, error: ctx.error }, { status: ctx.status });
}

async function authenticate(
  req: NextRequest,
): Promise<{ ok: true; uid: string } | Extract<Ctx, { ok: false }>> {
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    return {
      ok: false,
      error: "FIREBASE_SERVICE_ACCOUNT no configurado en el servidor.",
      status: 503,
    };
  }
  const token = bearerToken(req.headers.get("authorization"));
  if (!token) return { ok: false, error: "Autenticación requerida.", status: 401 };
  const user = await verifyIdToken(token);
  if (!user) {
    return { ok: false, error: "Sesión no válida o caducada.", status: 401 };
  }
  return { ok: true, uid: user.uid };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const route = url.searchParams.get("route");
  if (!route) {
    return errorResponse({ ok: false, error: "Falta el parámetro 'route'.", status: 400 });
  }

  let body: unknown;
  const bodyParam = url.searchParams.get("body");
  if (bodyParam) {
    try {
      body = JSON.parse(bodyParam);
    } catch {
      return errorResponse({ ok: false, error: "Parámetro 'body' inválido.", status: 400 });
    }
  }

  if (PUBLIC_ROUTES.has(route)) {
    return callAppsScript(route, "", body);
  }

  const auth = await authenticate(req);
  if (!auth.ok) return errorResponse(auth);
  return callAppsScript(route, auth.uid, body);
}

export async function POST(req: NextRequest) {
  let sent: { route?: string; body?: unknown } = {};
  try {
    sent = (await req.json()) as { route?: string; body?: unknown };
  } catch {
    return errorResponse({ ok: false, error: "Cuerpo JSON inválido.", status: 400 });
  }
  const route = sent.route;
  if (!route) {
    return errorResponse({ ok: false, error: "Falta el parámetro 'route'.", status: 400 });
  }

  if (PUBLIC_ROUTES.has(route)) {
    return callAppsScript(route, "", sent.body);
  }

  const auth = await authenticate(req);
  if (!auth.ok) return errorResponse(auth);
  return callAppsScript(route, auth.uid, sent.body);
}
