"use client";

import type { RolesMap } from "@/types";

/**
 * Caché de roles en localStorage: al volver a la app (F5 o navegación),
 * el gate se pinta al instante con lo cacheado mientras `user.me` verifica
 * en segundo plano. Solo lo usa AuthProvider; el dato vive ≤ la sesión
 * (se borra al salir) y siempre lo confirma la red.
 */

const CLAVE = "jam-roles-cache";

interface EntradaRoles {
  uid: string;
  roles: RolesMap;
  clavePendiente: boolean;
}

export function leerRolesCache(uid: string): EntradaRoles | null {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (!raw) return null;
    const dato = JSON.parse(raw) as EntradaRoles | null;
    if (!dato || typeof dato !== "object" || dato.uid !== uid) return null;
    if (!dato.roles || typeof dato.roles !== "object") return null;
    return dato;
  } catch {
    return null;
  }
}

export function escribirRolesCache(entrada: EntradaRoles): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(entrada));
  } catch {
    /* almacenamiento no disponible: sin caché seguimos funcionando */
  }
}

export function borrarRolesCache(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    /* almacenamiento no disponible */
  }
}
