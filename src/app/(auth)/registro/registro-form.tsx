"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { FirebaseError } from "firebase/app";
import {
  RECAPTCHA_SITE_KEY,
  ejecutarCaptcha,
  montarCaptcha,
  reiniciarCaptcha,
} from "@/lib/recaptcha";

export function RegistroForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [acepta, setAcepta] = useState(false);

  const captchaHostRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const tokenResolverRef = useRef<((token: string) => void) | null>(null);
  const captchaActivo = Boolean(RECAPTCHA_SITE_KEY) && !DEMO_MODE;

  useEffect(() => {
    if (!captchaActivo) return;
    const host = captchaHostRef.current;
    if (!host) return;
    let vivo = true;
    void montarCaptcha(
      host,
      (token) => tokenResolverRef.current?.(token),
      () =>
        setError(
          "La verificación anti-spam ha fallado. Recarga la página e inténtalo de nuevo.",
        ),
    )
      .then((id) => {
        if (vivo) widgetIdRef.current = id;
      })
      .catch(() => {
        /* si no monta al cargar, el envío lo reintenta */
      });
    return () => {
      vivo = false;
      tokenResolverRef.current = null;
    };
  }, [captchaActivo]);

  async function pedirTokenCaptcha(): Promise<string> {
    // Si el widget aún no montó (script lento o bloqueado), reintenta ahora.
    if (widgetIdRef.current === null && captchaHostRef.current) {
      widgetIdRef.current = await montarCaptcha(
        captchaHostRef.current,
        (token) => tokenResolverRef.current?.(token),
        () =>
          setError(
            "La verificación anti-spam ha fallado. Recarga la página e inténtalo de nuevo.",
          ),
      );
    }
    const id = widgetIdRef.current;
    if (id === null) {
      return Promise.reject(
        new Error(
          "No se pudo cargar la verificación anti-spam (¿bloqueador de anuncios o sin conexión a Google?). Desactívalo o recarga la página e inténtalo de nuevo.",
        ),
      );
    }
    return new Promise<string>((resolve, reject) => {
      const temporizador = setTimeout(
        () =>
          reject(
            new Error(
              "La verificación anti-spam tardó demasiado. Inténtalo de nuevo.",
            ),
          ),
        60_000,
      );
      tokenResolverRef.current = (token) => {
        clearTimeout(temporizador);
        resolve(token);
      };
      ejecutarCaptcha(id);
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acepta) {
      setError("Debes aceptar la política de privacidad y los términos de uso.");
      return;
    }
    setBusy(true);
    try {
      if (captchaActivo) {
        try {
          const captchaToken = await pedirTokenCaptcha();
          await api("public.captchaVerify", { captchaToken });
        } finally {
          if (widgetIdRef.current !== null) {
            reiniciarCaptcha(widgetIdRef.current);
          }
          tokenResolverRef.current = null;
        }
      }
      await register(nombre, email, password);
      await api("user.updateProfile", { nombre, email }).catch(() => undefined);
      router.replace("/mi");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(
          err.code === "auth/email-already-in-use"
            ? "Ya existe una cuenta con ese correo. Prueba a entrar."
            : err.code === "auth/weak-password"
              ? "La contraseña debe tener al menos 6 caracteres."
              : err.code === "auth/too-many-requests"
                ? "Demasiados intentos: espera unos minutos."
                : "No se pudo crear la cuenta. Revisa los datos.",
        );
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError("Error inesperado. Inténtalo de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 sm:min-h-[calc(100dvh-4rem)]">
      <div className="w-full max-w-sm">
        <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
          Únete a la jam
        </p>
        <h1 className="mt-1 mb-1 text-3xl font-black tracking-tight uppercase italic">
          Crear cuenta
        </h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Registro solo para participantes: te enviaremos un correo de
          verificación que debes abrir antes de entrar.
        </p>
        {DEMO_MODE && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            Modo demo: el registro crea un músico <strong>sin roles</strong> (solo
            «Mi zona» y material). Los paneles de rol se prueban con las cuentas
            del selector de acceso en «Entrar».
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
              Nombre
            </label>
            <input
              id="nombre"
              type="text"
              required
              autoComplete="name"
              autoCapitalize="words"
              autoCorrect="off"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:text-sm"
            />
          </div>

          <div className="flex items-start gap-2">
            <input
              id="acepta"
              type="checkbox"
              required
              checked={acepta}
              onChange={(e) => setAcepta(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-neutral-900 dark:accent-white"
            />
            <label
              htmlFor="acepta"
              className="text-xs text-neutral-600 dark:text-neutral-400"
            >
              He leído y acepto la{" "}
              <Link
                href="/privacidad"
                target="_blank"
                className="font-medium text-neutral-900 underline dark:text-white"
              >
                política de privacidad
              </Link>{" "}
              y los{" "}
              <Link
                href="/terminos"
                target="_blank"
                className="font-medium text-neutral-900 underline dark:text-white"
              >
                términos de uso
              </Link>
              .
            </label>
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#FFE600] px-4 py-2.5 text-sm font-extrabold tracking-wide text-black uppercase transition hover:bg-neutral-950 hover:text-[#FFE600] disabled:opacity-50"
          >
            {busy ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        {captchaActivo && (
          <>
            <div ref={captchaHostRef} aria-hidden="true" />
            <p className="mt-3 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
              Este sitio está protegido por reCAPTCHA y se aplican la{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Política de privacidad
              </a>{" "}
              y los{" "}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                Términos del Servicio
              </a>{" "}
              de Google.
            </p>
          </>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 underline dark:text-white"
          >
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
