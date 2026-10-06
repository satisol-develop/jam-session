"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./auth-provider";

/**
 * Guard de cliente: en el build exportado a GitHub Pages no hay proxy ni
 * middleware, así que las rutas privadas se protegen aquí redirigiendo a
 * /login cuando no hay sesión.
 */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [loading, user, router, pathname]);

  return { user, loading, pendiente: loading || !user };
}
