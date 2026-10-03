import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import type { RolesMap } from "@/types";

let app: App | undefined | null;

function parseServiceAccount(raw: string): Record<string, string> {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed) as Record<string, string>;
  }
  return JSON.parse(Buffer.from(trimmed, "base64").toString("utf8")) as Record<
    string,
    string
  >;
}

export function getAdminApp(): App | null {
  if (app) return app;
  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) return null;
  app = initializeApp({
    credential: cert(parseServiceAccount(raw)),
  });
  return app;
}

export function getAdminAuth(): Auth | null {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  return getAuth(adminApp);
}

export interface VerifiedUser {
  uid: string;
  email: string;
  nombre: string;
  roles: RolesMap;
}

export async function verifyIdToken(token: string): Promise<VerifiedUser | null> {
  const auth = getAdminAuth();
  if (!auth) return null;
  try {
    const decoded = await auth.verifyIdToken(token);
    const roles =
      typeof decoded.jam_roles === "object" && decoded.jam_roles !== null
        ? (decoded.jam_roles as RolesMap)
        : {};
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      nombre: (decoded.nombre as string) ?? decoded.name ?? "",
      roles,
    };
  } catch {
    return null;
  }
}
