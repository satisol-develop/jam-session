"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { guardarCookieLang } from "@/i18n/cookie";
import { hasLocale } from "@/i18n";

/**
 * Sincroniza <html lang> con la URL: en /es/* pone "es", en /eu/* "eu" y
 * fuera de la parte pública (paneles y /mi legado) "es". Además recuerda la
 * preferencia en cookie para que / redirija al idioma elegido la próxima vez.
 */
export function LangSync() {
  const pathname = usePathname();

  useEffect(() => {
    const seg = pathname.split("/")[1];
    const locale = hasLocale(seg) ? seg : "es";
    document.documentElement.lang = locale;
    if (hasLocale(seg)) guardarCookieLang(seg);
  }, [pathname]);

  return null;
}
