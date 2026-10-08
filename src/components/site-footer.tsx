"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Pie de página de la web pública y de /mi (no aparece en /panel, que
 * tiene su propia navegación fija).
 */
export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/panel")) return null;

  return (
    <footer className="border-t border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} Debarock Kolektiboa ·
          #DebarockKolektiboa
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/"
            className="inline-flex min-h-10 items-center text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Próxima sesión
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-10 items-center text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Entrar
          </Link>
          <Link
            href="/registro"
            className="inline-flex min-h-10 items-center text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Registro
          </Link>
          <Link
            href="/privacidad"
            className="inline-flex min-h-10 items-center text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Privacidad
          </Link>
          <Link
            href="/terminos"
            className="inline-flex min-h-10 items-center text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          >
            Términos
          </Link>
        </nav>
      </div>
    </footer>
  );
}
