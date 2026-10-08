"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { FirebaseError } from "firebase/app";

export function RegistroForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
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
        <h1 className="mb-1 text-2xl font-bold">Crear cuenta</h1>
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

          {error && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {busy ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

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
