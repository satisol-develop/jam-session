"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { rutaLocalizada } from "@/i18n";
import { useDict, useLocale } from "@/i18n/use-locale";
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
  const locale = useLocale();
  const d = useDict();
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
      () => setError(d.registro.captchaMontaje),
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
  }, [captchaActivo, d.registro.captchaMontaje]);

  async function pedirTokenCaptcha(): Promise<string> {
    // Si el widget aún no montó (script lento o bloqueado), reintenta ahora.
    if (widgetIdRef.current === null && captchaHostRef.current) {
      widgetIdRef.current = await montarCaptcha(
        captchaHostRef.current,
        (token) => tokenResolverRef.current?.(token),
        () => setError(d.registro.captchaMontaje),
      );
    }
    const id = widgetIdRef.current;
    if (id === null) {
      return Promise.reject(new Error(d.registro.captchaNoMonta));
    }
    return new Promise<string>((resolve, reject) => {
      const temporizador = setTimeout(
        () => reject(new Error(d.registro.captchaTimeout)),
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
      setError(d.registro.errorAcepta);
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
      router.replace(rutaLocalizada(locale, "/mi"));
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(
          err.code === "auth/email-already-in-use"
            ? d.registro.errorUsado
            : err.code === "auth/weak-password"
              ? d.registro.errorDebil
              : err.code === "auth/too-many-requests"
                ? d.registro.errorRate
                : d.registro.errorCrear,
        );
      } else if (err instanceof Error && err.message) {
        setError(err.message);
      } else {
        setError(d.registro.errorInesperado);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 sm:min-h-[calc(100dvh-4rem)]">
      <div className="w-full max-w-sm">
        <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
          {d.registro.kicker}
        </p>
        <h1 className="mt-1 mb-1 text-3xl font-black tracking-tight uppercase italic">
          {d.registro.crear}
        </h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          {d.registro.subtitulo}
        </p>
        {DEMO_MODE && (
          <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {d.registro.demoNota}
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium">
              {d.registro.nombre}
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
              {d.registro.correo}
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
              {d.registro.contrasena}
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
              {d.registro.aceptaAntes}
              <Link
                href={rutaLocalizada(locale, "/privacidad")}
                target="_blank"
                className="font-medium text-neutral-900 underline dark:text-white"
              >
                {d.registro.politica}
              </Link>
              {d.registro.yLos}
              <Link
                href={rutaLocalizada(locale, "/terminos")}
                target="_blank"
                className="font-medium text-neutral-900 underline dark:text-white"
              >
                {d.registro.terminos}
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
            {busy ? d.registro.creando : d.registro.crear}
          </button>
        </form>

        {captchaActivo && (
          <>
            <div ref={captchaHostRef} aria-hidden="true" />
            <p className="mt-3 text-center text-[11px] text-neutral-400 dark:text-neutral-500">
              {d.registro.recaptcha1}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {d.registro.politicaGoogle}
              </a>
              {d.registro.recaptcha2}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                {d.registro.terminosGoogle}
              </a>
              {d.registro.recaptcha3}
            </p>
          </>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {d.registro.yaCuenta}{" "}
          <Link
            href={rutaLocalizada(locale, "/login")}
            className="font-medium text-neutral-900 underline dark:text-white"
          >
            {d.registro.entrar}
          </Link>
        </p>
      </div>
    </div>
  );
}
