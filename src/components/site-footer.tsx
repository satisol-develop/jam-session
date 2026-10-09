"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeDeRuta, rutaLocalizada } from "@/i18n";
import { useDict } from "@/i18n/use-locale";

/**
 * Pie de página de la web pública y de /mi (no aparece en /panel, que
 * tiene su propia navegación fija). Los enlaces se localizan solo en la
 * parte pública (/es, /eu); en /mi se quedan en castellano.
 */
export function SiteFooter() {
  const pathname = usePathname();
  const d = useDict();
  if (pathname.startsWith("/panel")) return null;

  const publico = localeDeRuta(pathname);
  const l = (ruta: string) => (publico ? rutaLocalizada(publico, ruta) : ruta);
  const clase =
    "inline-flex min-h-10 items-center text-neutral-500 transition hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white";

  return (
    <footer className="border-t border-neutral-200 bg-white/90 dark:border-neutral-800 dark:bg-black/80">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-6 text-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-neutral-500 dark:text-neutral-400">
          © {new Date().getFullYear()} Debarock Kolektiboa ·{" "}
          <span className="font-semibold text-red-500">
            #DebarockKolektiboa
          </span>
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          <Link href={l("/")} className={clase}>
            {d.footer.proxima}
          </Link>
          <Link href={l("/login")} className={clase}>
            {d.footer.entrar}
          </Link>
          <Link href={l("/registro")} className={clase}>
            {d.footer.registro}
          </Link>
          <Link href={l("/privacidad")} className={clase}>
            {d.footer.privacidad}
          </Link>
          <Link href={l("/terminos")} className={clase}>
            {d.footer.terminos}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
