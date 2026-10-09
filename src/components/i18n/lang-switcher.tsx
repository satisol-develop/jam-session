"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { localeDeRuta, locales, rutaLocalizada } from "@/i18n";
import { useDict } from "@/i18n/use-locale";

/**
 * Botón ES/EU de la cabecera: solo aparece en la parte localizada (/es, /eu).
 * Conserva la ruta actual cambiando el segmento de idioma; al navegar,
 * LangSync guarda la preferencia en la cookie jam_lang para que la próxima
 * visita a / redirija al idioma elegido.
 */
export function LangSwitcher() {
  const pathname = usePathname();
  const d = useDict();
  const actual = localeDeRuta(pathname);
  if (!actual) return null;

  const resto = pathname.replace(/^\/(?:es|eu)(?=\/|$)/, "") || "/";

  return (
    <div
      role="group"
      aria-label={d.header.idioma}
      className="flex items-center rounded-lg border border-neutral-200 dark:border-neutral-800"
    >
      {locales.map((loc) => (
        <Link
          key={loc}
          href={rutaLocalizada(loc, resto)}
          lang={loc}
          hrefLang={loc}
          aria-current={loc === actual ? "true" : undefined}
          className={`px-2 py-1.5 text-xs font-bold uppercase transition ${
            loc === actual
              ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
              : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
          }`}
        >
          {loc}
        </Link>
      ))}
    </div>
  );
}
