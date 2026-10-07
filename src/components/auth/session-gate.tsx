"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { sendEmailVerification, updatePassword } from "firebase/auth";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { FirebaseError } from "firebase/app";
import { PantallaCargando } from "@/components/loading";

/**
 * Capa de verificación: mientras la plataforma comprueba sesión y roles no
 * se pinta el interior (cargando a pantalla completa); si la verificación
 * falla, pantalla de error con Reintentar/Salir. La cabecera (con «Salir»)
 * sigue visible fuera del gate.
 */

function ErrorVerificacion({
  mensaje,
  onReintentar,
  onSalir,
  busy,
}: {
  mensaje: string;
  onReintentar: () => void;
  onSalir: () => void;
  busy: boolean;
}) {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4 dark:bg-black"
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-lg font-bold">No se pudo verificar tu sesión</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          {mensaje}
        </p>
        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={onReintentar}
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {busy ? "Reintentando…" : "Reintentar"}
          </button>
          <button
            type="button"
            onClick={onSalir}
            className="w-full px-4 py-2 text-sm text-neutral-500 underline"
          >
            Salir
          </button>
        </div>
      </div>
    </div>
  );
}

export function SessionGate({ children }: { children: ReactNode }) {
  const {
    user,
    loading,
    rolesError,
    clavePendiente,
    refreshUser,
    reintentar,
    logout,
  } = useAuth();
  const [clave, setClave] = useState("");
  const [clave2, setClave2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [reintentando, setReintentando] = useState(false);

  // 1) Verificación en curso: nada del interior se pinta sin confirmar.
  if (loading) {
    return (
      <>
        {children}
        <PantallaCargando texto="Verificando sesión…" />
      </>
    );
  }

  if (DEMO_MODE || !user) return <>{children}</>;

  // 2) La verificación falló (token rechazado, sin red…): bloquea todo.
  if (rolesError) {
    return (
      <>
        {children}
        <ErrorVerificacion
          mensaje={rolesError}
          busy={reintentando}
          onReintentar={() => {
            setReintentando(true);
            void (async () => {
              try {
                await reintentar();
              } finally {
                setReintentando(false);
              }
            })();
          }}
          onSalir={() => void logout()}
        />
      </>
    );
  }

  const u = user;

  if (clavePendiente) {
    async function onChangePassword(e: FormEvent) {
      e.preventDefault();
      setError(null);
      setAviso(null);
      if (clave !== clave2) {
        setError("Las contraseñas no coinciden.");
        return;
      }
      if (clave.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
      setBusy(true);
      try {
        await updatePassword(u, clave);
        await api("user.passwordChanged", {});
        if (!u.emailVerified) {
          try {
            await sendEmailVerification(u);
          } catch {
            // Correo ya enviado hace un momento: se ignora.
          }
        }
        await refreshUser();
        setClave("");
        setClave2("");
        setAviso("Contraseña actualizada.");
      } catch (err) {
        if (err instanceof FirebaseError) {
          setError(
            err.code === "auth/too-many-requests"
              ? "Demasiados intentos: espera unos minutos."
              : err.code === "auth/weak-password"
                ? "La contraseña debe tener al menos 6 caracteres."
                : err.code === "auth/requires-recent-login"
                  ? "Tu sesión ha caducado: sal y vuelve a entrar para cambiarla."
                  : "No se pudo actualizar la contraseña.",
          );
        } else if (err instanceof Error && err.message) {
          setError(err.message);
        } else {
          setError("No se pudo actualizar la contraseña.");
        }
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col justify-center px-4 py-10">
        <h1 className="mb-1 text-2xl font-bold">Cambia tu contraseña</h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          Tu cuenta se creó con una contraseña temporal. Define la tuya para
          continuar usando la plataforma.
        </p>
        <form onSubmit={onChangePassword} className="space-y-4">
          <div>
            <label htmlFor="clave-nueva" className="mb-1 block text-sm font-medium">
              Nueva contraseña
            </label>
            <input
              id="clave-nueva"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="clave-repetir" className="mb-1 block text-sm font-medium">
              Repite la contraseña
            </label>
            <input
              id="clave-repetir"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={clave2}
              onChange={(e) => setClave2(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-base text-black outline-none focus:border-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-white sm:text-sm"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          )}
          {aviso && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
              {aviso}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {busy ? "Guardando…" : "Guardar contraseña"}
          </button>
        </form>
      </div>
    );
  }

  if (!user.emailVerified) {
    async function onResend() {
      setError(null);
      setAviso(null);
      setBusy(true);
      try {
        await sendEmailVerification(u);
        setAviso("Correo de verificación reenviado.");
      } catch (err) {
        setError(
          err instanceof FirebaseError && err.code === "auth/too-many-requests"
            ? "Demasiados correos seguidos: espera unos minutos."
            : "No se pudo reenviar el correo.",
        );
      } finally {
        setBusy(false);
      }
    }

    async function onVerified() {
      setError(null);
      setAviso(null);
      setBusy(true);
      try {
        await refreshUser();
        if (!u.emailVerified) {
          setError(
            "Todavía no aparece como verificado. Abre el enlace del correo e inténtalo de nuevo.",
          );
        }
      } catch {
        setError("No se pudo comprobar. Inténtalo de nuevo.");
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col justify-center px-4 py-10">
        <h1 className="mb-1 text-2xl font-bold">Verifica tu correo</h1>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          Hemos enviado un correo de verificación a{" "}
          <span className="font-semibold break-all">{user.email}</span>. Abre el
          enlace de ese correo para activar tu cuenta (revisa también el spam).
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}
        {aviso && (
          <p className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {aviso}
          </p>
        )}

        <div className="space-y-2">
          <button
            type="button"
            onClick={onVerified}
            disabled={busy}
            className="w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-neutral-200"
          >
            {busy ? "Comprobando…" : "Ya he verificado mi correo"}
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            Reenviar el correo
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full px-4 py-2 text-sm text-neutral-500 underline"
          >
            Salir
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
