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
  const enPanel = pathname.startsWith("/panel");

  const headerCls = enPanel
    ? "border-white/10 bg-[#0d0d0d]/95 text-[#f2f2f2]"
    : "border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-black/80";
  const linkCls = enPanel
    ? "rounded-lg px-3 py-2 font-medium transition hover:bg-white/10"
    : "rounded-lg px-3 py-2 font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-900";
  const linkActivo = enPanel
    ? "bg-white/10"
    : "bg-neutral-100 dark:bg-neutral-900";
  const mutedCls = enPanel
    ? "hidden max-w-[10rem] truncate px-2 text-white/50 sm:inline"
    : "hidden max-w-[10rem] truncate px-2 text-neutral-500 sm:inline";

  return (
    <header className={`sticky top-0 z-40 border-b ${headerCls}`}>
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16">
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
                className={`${linkCls} ${isActive("/mi") ? linkActivo : ""}`}
              >
                Mi zona
              </Link>
              {tieneRoles && (
                <Link
                  href="/panel"
                  className={`${linkCls} ${
                    pathname.startsWith("/panel") ? linkActivo : ""
                  }`}
                >
                  Panel
                </Link>
              )}
              <span className={mutedCls}>
                {user.displayName ?? user.email}
              </span>
              <button
                onClick={onLogout}
                className={`${linkCls} ${
                  enPanel ? "text-white/60" : "text-neutral-500"
                }`}
              >
                Salir
              </button>
            </>
          ) : loading ? (
            <span className="px-3 text-neutral-400">…</span>
          ) : (
            <>
              <Link href="/login" className={linkCls}>
                Entrar
              </Link>
              <Link
                href="/registro"
                className={
                  enPanel
                    ? "rounded-lg bg-[#FFE600] px-3 py-2 font-semibold text-black transition hover:bg-white"
                    : "rounded-lg bg-neutral-900 px-3 py-2 font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black"
                }
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
