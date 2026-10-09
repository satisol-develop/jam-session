import type { Metadata } from "next";
import { getDict, hasLocale, type Locale } from "./index";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * `alternates` de una página pública: canonical al idioma actual y
 * hreflang a las dos versiones. `x-default` apunta a la URL antigua
 * (sin idioma), que redirige al visitante (cookie → navegador → es).
 */
export function alternatesLocale(ruta: string): Metadata["alternates"] {
  const p = ruta === "/" ? "" : ruta;
  return {
    canonical: `${BASE}/es${p}/`,
    languages: {
      es: `${BASE}/es${p}/`,
      eu: `${BASE}/eu${p}/`,
      "x-default": `${BASE}${p}/`,
    },
  };
}

/** Lo mismo, pero con el canonical en el idioma dado. */
export function alternatesPara(
  locale: Locale,
  ruta: string,
): Metadata["alternates"] {
  const p = ruta === "/" ? "" : ruta;
  return {
    canonical: `${BASE}/${locale}${p}/`,
    languages: {
      es: `${BASE}/es${p}/`,
      eu: `${BASE}/eu${p}/`,
      "x-default": `${BASE}${p}/`,
    },
  };
}

/** Metadata de redirección (URLs viejas): indexable solo el idioma real. */
export const REDIRECT_METADATA: Metadata = {
  robots: { index: false, follow: true },
};

export function localeValido(v: string): v is Locale {
  return hasLocale(v);
}

export function tituloDe(locale: Locale, seccion: "login" | "registro"): string {
  return getDict(locale)[seccion].title;
}
