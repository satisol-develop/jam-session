"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { leerCookieLang, guardarCookieLang } from "@/i18n/cookie";

/**
 * Redirección de las URLs antiguas (sin /es/ ni /eu/) al idioma adecuado:
 * 1) cookie de preferencia (jam_lang), 2) idioma del navegador, 3) castellano.
 * Mientras tanto (y sin JavaScript) se muestran enlaces visibles a las dos
 * versiones, así ningún rastreador ni navegador sin JS se queda sin salida.
 */
export function IrAIdioma({ ruta }: { ruta: string }) {
  const router = useRouter();

  useEffect(() => {
    const guardado = leerCookieLang();
    const nav = typeof navigator !== "undefined" ? navigator.language : "es";
    const locale = guardado ?? (nav.toLowerCase().startsWith("eu") ? "eu" : "es");
    guardarCookieLang(locale);
    // Conserva la query (?next=…): los enlaces de retorno la necesitan.
    const query = window.location.search;
    router.replace(`/${locale}${ruta}${query}`);
  }, [router, ruta]);

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
          Debarock Kolektiboa
        </p>
        <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
          Elige idioma · Hizkuntza aukeratu
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href={`/es${ruta}`}
            className="inline-flex min-h-11 items-center rounded-xl bg-[#FFE600] px-6 text-sm font-extrabold tracking-wide text-black uppercase transition hover:bg-neutral-950 hover:text-[#FFE600]"
          >
            Castellano
          </Link>
          <Link
            href={`/eu${ruta}`}
            className="inline-flex min-h-11 items-center rounded-xl border-2 border-neutral-950 px-6 text-sm font-extrabold tracking-wide text-neutral-950 uppercase transition hover:bg-neutral-950 hover:text-white dark:border-white dark:text-white dark:hover:bg-white dark:hover:text-black"
          >
            Euskara
          </Link>
        </div>
      </div>
    </div>
  );
}
