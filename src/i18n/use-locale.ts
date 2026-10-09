"use client";

import { usePathname } from "next/navigation";
import {
  DEFAULT_LOCALE,
  getDict,
  hasLocale,
  type Dict,
  type Locale,
} from "./index";

/**
 * Idioma de la parte pública: lo determina el segmento de la URL
 * (/es/... o /eu/...). Fuera de esas rutas (paneles y Mi zona, que están
 * solo en castellano) devuelve el idioma por defecto.
 */
export function useLocale(): Locale {
  const pathname = usePathname();
  const seg = pathname.split("/")[1];
  return hasLocale(seg) ? seg : DEFAULT_LOCALE;
}

/** Diccionario del idioma actual (para componentes cliente). */
export function useDict(): Dict {
  return getDict(useLocale());
}
