"use client";

import Link from "next/link";
import { useDict } from "@/i18n/use-locale";

/**
 * Pantalla de error compartida por / (raíz) y /[locale]: se muestra cuando
 * un error de render cae en un error.tsx. En la raíz el idioma por defecto
 * lo resuelve el diccionario del cliente (fuera de /es|/eu = castellano).
 */
export function ErrorPagina({ onReintentar }: { onReintentar?: () => void }) {
  const d = useDict();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-lg font-bold text-neutral-950 dark:text-white">
          {d.errores.errorTitulo}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {d.errores.errorTexto}
        </p>
        <div className="mt-5 space-y-2">
          {onReintentar && (
            <button
              type="button"
              onClick={onReintentar}
              className="w-full min-h-10 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
            >
              {d.gate.reintentar}
            </button>
          )}
          <Link
            href="/"
            className="block w-full min-h-10 rounded-xl px-4 py-2.5 text-sm text-neutral-500 underline dark:text-neutral-400"
          >
            {d.errores.volverInicio}
          </Link>
        </div>
      </div>
    </main>
  );
}
