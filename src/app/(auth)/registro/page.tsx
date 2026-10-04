"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { FirebaseError } from "firebase/app";

export default function RegistroPage() {
  const { register, signInWithGoogle } = useAuth();
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
      await api("user.create", { nombre, email }).catch(() => undefined);
      router.replace("/mi");
    } catch (err) {
      if (err instanceof FirebaseError) {
        setError(
          err.code === "auth/email-already-in-use"
            ? "Ya existe una cuenta con ese correo."
            : err.code === "auth/weak-password"
              ? "La contraseña debe tener al menos 6 caracteres."
              : "No se pudo crear la cuenta. Revisa los datos.",
        );
      } else {
        setError("Error inesperado. Inténtalo de nuevo.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function onGoogle() {
    setError(null);
    try {
      await signInWithGoogle();
      router.replace("/mi");
    } catch {
      setError("No se pudo iniciar sesión con Google.");
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold">Crear cuenta</h1>
        <p className="mb-6 text-sm text-neutral-500">
          Regístrate para inscribirte en la Jam Session.
        </p>
        {DEMO_MODE && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
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
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-neutral-900"
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
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-neutral-900"
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
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-black outline-none focus:border-neutral-900"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50"
          >
            {busy ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>

        <button
          onClick={onGoogle}
          className="mt-3 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100"
        >
          Continuar con Google
        </button>

        <p className="mt-6 text-center text-sm text-neutral-500">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
