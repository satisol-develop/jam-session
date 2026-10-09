"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { DEMO_MODE } from "@/lib/demo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LangSwitcher } from "@/components/i18n/lang-switcher";
import { RoleSwitcher } from "@/components/role-switcher";
import { ROLES } from "@/types";
import { localeDeRuta, rutaLocalizada } from "@/i18n";
import { useDict } from "@/i18n/use-locale";

export function SiteHeader() {
  const { user, roles, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const tieneRoles = ROLES.some((r) => roles[r]);
  // En la parte localizada (pública y Mi zona) los enlaces llevan /es o /eu;
  // en los paneles y en las URLs antiguas sin idioma se queda la ruta base.
  const d = useDict();
  const publico = localeDeRuta(pathname);
  const l = (ruta: string) => (publico ? rutaLocalizada(publico, ruta) : ruta);
  const hrefMi = l("/mi");

  // El modo oscuro es una opción de la plataforma (logueado); fuera siempre claro.
  useEffect(() => {
    const raiz = document.documentElement;
    if (!user) {
      raiz.classList.remove("dark");
      return;
    }
    try {
      if (localStorage.getItem("jam-theme") === "dark") raiz.classList.add("dark");
    } catch {
      /* almacenamiento no disponible */
    }
  }, [user]);

  async function onLogout() {
    await logout();
    router.replace("/");
  }

  const enPanel = pathname.startsWith("/panel");

  const headerCls = enPanel
    ? "border-white/10 bg-[#0d0d0d]/95 text-[#f2f2f2]"
    : "border-neutral-200 bg-white/90 backdrop-blur dark:border-neutral-800 dark:bg-black/80";
  const linkCls = enPanel
    ? "rounded-lg px-2 py-2.5 font-medium transition hover:bg-white/10 sm:px-3 sm:py-2"
    : "rounded-lg px-2 py-2.5 font-medium transition hover:bg-neutral-100 dark:hover:bg-neutral-900 sm:px-3 sm:py-2";
  const linkActivo = enPanel
    ? "bg-white/10"
    : "bg-neutral-100 dark:bg-neutral-900";
  const mutedCls = enPanel
    ? "hidden max-w-[10rem] truncate px-2 text-white/50 sm:inline"
    : "hidden max-w-[10rem] truncate px-2 text-neutral-500 dark:text-neutral-400 sm:inline";

  return (
    <header
      className={`sticky top-0 z-40 border-b pt-[env(safe-area-inset-top)] ${headerCls}`}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={l("/")}
            className="inline-flex min-h-11 items-center text-lg font-black tracking-tight"
          >
            Jam<span className="text-red-500">Session</span>
          </Link>
          {DEMO_MODE && (
            <span className="hidden rounded-full border border-amber-500/50 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 sm:inline-block">
              Demo
            </span>
          )}
        </div>

        <nav className="flex min-w-0 items-center gap-0.5 text-sm sm:gap-1">
          <LangSwitcher />
          {!loading && user && <ThemeToggle enPanel={enPanel} />}
          {!loading && user ? (
            <>
              {/* Mi zona por defecto solo para músicos; el equipo que entra
                  como participante la ve mientras está dentro. */}
              {/* Mi zona por defecto solo para músicos; el equipo que entra
                  como participante la ve mientras está dentro. En móvil, con
                  roles, el enlace se oculta: su espacio lo ocupa «Panel ▾»,
                  cuya hoja incluye la fila «Participante · Mi zona». */}
              {(!tieneRoles || (pathname === hrefMi && !roles.admin)) && (
                <Link
                  href={hrefMi}
                  className={`${linkCls} ${pathname === hrefMi ? linkActivo : ""} ${
                    tieneRoles ? "max-sm:hidden" : ""
                  }`}
                >
                  {d.header.miZona}
                </Link>
              )}
              <RoleSwitcher linkCls={linkCls} linkActivo={linkActivo} />
              <span className={mutedCls}>
                {user.displayName ?? user.email}
              </span>
              <button
                onClick={onLogout}
                className={`${linkCls} ${
                  enPanel ? "text-white/60" : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {d.header.salir}
              </button>
            </>
          ) : loading ? (
            <span
              className={`px-3 ${
                enPanel ? "text-white/50" : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              …
            </span>
          ) : (
            <>
              <Link href={l("/login")} className={linkCls}>
                {d.header.entrar}
              </Link>
              <Link
                href={l("/registro")}
                className="inline-flex min-h-10 items-center rounded-lg bg-[#FFE600] px-3 py-2 font-semibold text-black transition hover:bg-white"
              >
                {d.header.registro}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
