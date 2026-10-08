"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { DEMO_MODE } from "@/lib/demo";
import { DEMO_ACCOUNTS } from "@/lib/demo/data";
import { ROLES_META } from "@/lib/constants";
import { ROLES, type RolesMap } from "@/types";
import { FirebaseError } from "firebase/app";

export function LoginForm() {
  const { signIn } = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = search.get("next");

  /** Sin `next`: el equipo va a su panel y los músicos a Mi zona. */
  function destinoPostLogin(mapa: RolesMap): string {
    if (next) return next;
    return ROLES.some((r) => mapa[r]) ? "/panel" : "/mi";
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const mapa = await signIn(email, password);
      router.replace(destinoPostLogin(mapa));
    } catch (err) {
      setError(
        err instanceof FirebaseError
          ? err.code === "auth/too-many-requests"
            ? "Demasiados intentos: espera unos minutos antes de probar."
            : "Credenciales incorrectas o usuario no encontrado."
          : err instanceof Error && err.message
            ? err.message
            : "Error inesperado. Inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function quickLogin(email: string) {
    setError(null);
    setBusy(true);
    try {
      const mapa = await signIn(email, "demo");
      router.replace(destinoPostLogin(mapa));
    } catch {
      setError("No se pudo iniciar la sesión de demo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[calc(100dvh-3.5rem)] items-center justify-center px-4 sm:min-h-[calc(100dvh-4rem)]">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">Entrar</h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Accede para inscribirte y ver el material.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:text-sm"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {busy ? "Entrando…" : "Entrar"}
          </button>
        </form>

        {DEMO_MODE && (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-950">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Modo demo · entra como
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.uid}
                  type="button"
                  onClick={() => quickLogin(a.email)}
                  disabled={busy}
                  className="min-h-9 rounded-full border border-neutral-300 bg-white px-2.5 py-2 text-xs font-medium transition hover:border-neutral-900 disabled:opacity-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-white"
                  title={a.email}
                >
                  {a.rol ? ROLES_META[a.rol].label.split("·")[0].trim() : "Músico"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
              Cada cuenta solo ve su panel (el músico no tiene roles). Contraseña
              libre; en registro se crea un músico sin roles.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-medium text-neutral-900 underline dark:text-white"
          >
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
