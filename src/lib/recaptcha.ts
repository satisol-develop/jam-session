"use client";

/**
 * reCAPTCHA v2 invisible (solo registro). Sin `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
 * no se carga nada (entornos de prueba); en producción la key se inyecta en
 * el build (GitHub Secrets) y el token se valida en el backend
 * (`public.captchaVerify` → siteverify con `RECAPTCHA_SECRET`).
 */

export const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

interface Grecaptcha {
  render(container: HTMLElement, options: Record<string, unknown>): number;
  execute(widgetId: number): void;
  reset(widgetId?: number): void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let cargando: Promise<void> | null = null;

function cargarScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.grecaptcha) return Promise.resolve();
  if (!cargando) {
    cargando = new Promise<void>((resolve, reject) => {
      if (!document.querySelector('link[rel="preconnect"][href="https://www.google.com"]')) {
        const pc = document.createElement("link");
        pc.rel = "preconnect";
        pc.href = "https://www.google.com";
        document.head.appendChild(pc);
      }
      const s = document.createElement("script");
      s.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      s.async = true;
      s.defer = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("No se pudo cargar reCAPTCHA."));
      document.head.appendChild(s);
    });
  }
  return cargando;
}

/**
 * Monta el widget invisible en `contenedor`. `alRecibirToken` se invoca con
 * el token cuando Google lo emite (tras execute). Devuelve el id del widget
 * o null si no hay key o el script no carga. Idempotente por contenedor.
 */
export async function montarCaptcha(
  contenedor: HTMLElement,
  alRecibirToken: (token: string) => void,
  alError: () => void,
): Promise<number | null> {
  if (!RECAPTCHA_SITE_KEY) return null;
  const host = contenedor as HTMLElement & { __captchaId?: number };
  if (host.__captchaId !== undefined) return host.__captchaId;
  try {
    await cargarScript();
  } catch {
    return null;
  }
  const g = window.grecaptcha;
  if (!g || typeof g.render !== "function") return null;
  try {
    const id = g.render(contenedor, {
      sitekey: RECAPTCHA_SITE_KEY,
      size: "invisible",
      callback: alRecibirToken,
      "error-callback": alError,
    });
    host.__captchaId = id;
    return id;
  } catch (err) {
    console.error("reCAPTCHA: no se pudo montar el widget", err);
    return null;
  }
}

/** Dispara la resolución del widget (el token llega por callback). */
export function ejecutarCaptcha(widgetId: number): void {
  window.grecaptcha?.execute(widgetId);
}

/** Reinicia el widget para poder pedir un token nuevo (son de un solo uso). */
export function reiniciarCaptcha(widgetId: number): void {
  window.grecaptcha?.reset(widgetId);
}
