"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { DEMO_MODE } from "@/lib/demo";

export function SiteHeader() {
  const { user, roles, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const tieneRoles = Object.keys(roles).length > 0;

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-black/80">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-lg font-black tracking-tight">
            Jam<span className="text-red-500">Session</span>
          </Link>
          {DEMO_MODE && (
            <span className="rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Demo
            </span>
          )}
        </div>

        <nav className="flex items-center gap-1 text-sm">
          {!loading && user ? (
            <>
              <Link
                href="/mi"
                className={`rounded-lg px-3 py-2 font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                  isActive("/mi") ? "bg-neutral-100 dark:bg-neutral-900" : ""
                }`}
              >
                Mi zona
              </Link>
              {tieneRoles && (
                <Link
                  href="/panel"
                  className={`rounded-lg px-3 py-2 font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-900 ${
                    pathname.startsWith("/panel")
                      ? "bg-neutral-100 dark:bg-neutral-900"
                      : ""
                  }`}
                >
                  Panel
                </Link>
              )}
              <span className="hidden max-w-[10rem] truncate px-2 text-neutral-500 sm:inline">
                {user.displayName ?? user.email}
              </span>
              <button
                onClick={onLogout}
                className="rounded-lg px-3 py-2 font-medium text-neutral-500 transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                Salir
              </button>
            </>
          ) : loading ? (
            <span className="px-3 text-neutral-400">…</span>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-neutral-900 px-3 py-2 font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black"
              >
                Registro
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
