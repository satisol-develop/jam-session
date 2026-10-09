import { es } from "./es";
import { eu } from "./eu";

/** Idiomas soportados por la parte pública de la web. */
export const locales = ["es", "eu"] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "es";

export function hasLocale(v: string): v is Locale {
  return (locales as readonly string[]).includes(v);
}

/** Forma que deben cumplir ambos diccionarios (paridad en compilación). */
export type Dict = typeof es;

const DICTS: Record<Locale, Dict> = { es, eu };

export function getDict(locale: Locale): Dict {
  return DICTS[locale] ?? DICTS[DEFAULT_LOCALE];
}

/** Sustituye `{clave}` por el valor dado en un texto del diccionario. */
export function fmt(texto: string, params: Record<string, string | number>): string {
  return Object.entries(params).reduce(
    (acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)),
    texto,
  );
}

/**
 * Etiqueta de instrumento en el idioma actual. Los datos se guardan en
 * castellano (Sheets), así que la clave es la etiqueta original y se
 * devuelve tal cual si el diccionario no la conoce.
 */
export function traducirInstrumento(d: Dict, etiqueta: string): string {
  const clave = etiqueta as keyof Dict["instrumentos"];
  return clave in d.instrumentos ? d.instrumentos[clave] : etiqueta;
}

/** Ruta pública localizada: rutaLocalizada("es", "/login") → "/es/login". */
export function rutaLocalizada(locale: Locale, ruta: string): string {
  return `/${locale}${ruta === "/" ? "" : ruta}`;
}

/** Idioma del segmento actual de la URL (para usos sin hooks). */
export function localeDeRuta(pathname: string): Locale | null {
  const seg = pathname.split("/")[1];
  return hasLocale(seg) ? seg : null;
}

/**
 * Idioma vigente en cliente, para mensajes generados fuera de componentes
 * (proveedor de auth, cliente de API): el segmento de la URL actual; fuera
 * de /es|/eu (paneles) o en servidor, castellano. Como el texto se construye
 * justo cuando ocurre el error y se muestra en la misma navegación, el
 * idioma de la URL es el de la pantalla donde aparecerá.
 */
export function localeActual(): Locale {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  return localeDeRuta(document.location.pathname) ?? DEFAULT_LOCALE;
}
