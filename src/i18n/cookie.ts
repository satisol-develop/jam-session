import { hasLocale, type Locale } from "./index";

const COOKIE = "jam_lang";

/** Preferencia de idioma guardada en cookie (1 año). */
export function leerCookieLang(): Locale | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE}=([^;]*)`));
  return m && m[1] && hasLocale(m[1]) ? (m[1] as Locale) : null;
}

export function guardarCookieLang(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}
