import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken, getAdminAuth } from "@/lib/firebase/admin";
import { callGs } from "@/lib/api/server";
import type { RoleAssignment, RolesMap, Rol } from "@/types";

interface RotateBody {
  mes: string;
  asignaciones: RoleAssignment[];
}

interface RotateData {
  mes: string;
  asignaciones: RoleAssignment[];
  anteriores: RoleAssignment[];
}

function rolesByUser(
  asignaciones: RoleAssignment[],
): Map<string, RolesMap> {
  const map = new Map<string, RolesMap>();
  for (const a of asignaciones) {
    const current = map.get(a.uid) ?? {};
    current[a.rol as Rol] = a.tipo;
    map.set(a.uid, current);
  }
  return map;
}

export async function POST(req: NextRequest) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: "Autenticación requerida." },
      { status: 401 },
    );
  }
  const user = await verifyIdToken(token);
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Sesión no válida o caducada." },
      { status: 401 },
    );
  }
  if (user.roles.admin !== "titular") {
    return NextResponse.json(
      { ok: false, error: "Solo el Admin titular puede rotar roles." },
      { status: 403 },
    );
  }

  let body: RotateBody;
  try {
    body = (await req.json()) as RotateBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Cuerpo JSON inválido." },
      { status: 400 },
    );
  }
  if (!body?.mes || !Array.isArray(body.asignaciones)) {
    return NextResponse.json(
      { ok: false, error: "Faltan 'mes' o 'asignaciones'." },
      { status: 400 },
    );
  }

  const result = await callGs<RotateData>("admin.rotate", body, user.uid);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  const auth = getAdminAuth();
  if (auth) {
    const nuevas = rolesByUser(result.data?.asignaciones ?? []);
    const anteriores = rolesByUser(result.data?.anteriores ?? []);
    const uids = new Set([...nuevas.keys(), ...anteriores.keys()]);
    await Promise.all(
      Array.from(uids).map((uid) =>
        auth.setCustomUserClaims(uid, {
          jam_roles: nuevas.get(uid) ?? {},
        }),
      ),
    );
  }

  return NextResponse.json({
    ok: true,
    data: {
      mes: result.data?.mes ?? body.mes,
      actualizados: new Set([
        ...(result.data?.asignaciones ?? []).map((a) => a.uid),
        ...(result.data?.anteriores ?? []).map((a) => a.uid),
      ]).size,
    },
  });
}
