import Link from "next/link";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, getDict, hasLocale, rutaLocalizada } from "@/i18n";

/** 404 global (también la renderiza [locale] con notFound()). */
export default async function NoEncontrado() {
  const store = await cookies();
  const guardado = store.get("jam_lang")?.value ?? "";
  const locale = hasLocale(guardado) ? guardado : DEFAULT_LOCALE;
  const d = getDict(locale);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
          404
        </p>
        <h1 className="mt-1 text-lg font-bold text-neutral-950 dark:text-white">
          {d.errores.noEncontradaTitulo}
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {d.errores.noEncontradaTexto}
        </p>
        <Link
          href={rutaLocalizada(locale, "/")}
          className="mt-5 block w-full min-h-10 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
        >
          {d.errores.volverInicio}
        </Link>
      </div>
    </main>
  );
}
