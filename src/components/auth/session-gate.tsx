"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { sendEmailVerification, updatePassword } from "firebase/auth";
import { useAuth, mensajeCorreoError } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { FirebaseError } from "firebase/app";
import { PantallaCargando } from "@/components/loading";
import { useDict } from "@/i18n/use-locale";

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
  const d = useDict();
  return (
    <div
      role="alert"
      className="fixed inset-0 z-50 flex items-center justify-center bg-white p-4 dark:bg-black"
    >
      <div className="w-full max-w-sm rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-xl dark:border-neutral-800 dark:bg-neutral-950">
        <h1 className="text-lg font-bold">{d.gate.tituloError}</h1>
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
            {busy ? d.gate.reintentando : d.gate.reintentar}
          </button>
          <button
            type="button"
            onClick={onSalir}
            className="w-full px-4 py-2 text-sm text-neutral-500 underline dark:text-neutral-400"
          >
            {d.gate.salir}
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
    registroAviso,
    setRegistroAviso,
  } = useAuth();
  const d = useDict();
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
        <PantallaCargando texto={d.gate.verificando} />
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
        setError(d.gate.clavesNoCoinciden);
        return;
      }
      if (clave.length < 6) {
        setError(d.registro.errorDebil);
        return;
      }
      setBusy(true);
      try {
        await updatePassword(u, clave);
        await api("user.passwordChanged", {});
        if (!u.emailVerified) {
          try {
            await sendEmailVerification(u);
            setRegistroAviso(null);
          } catch (err) {
            setRegistroAviso(mensajeCorreoError(err));
          }
        }
        await refreshUser();
        setClave("");
        setClave2("");
        setAviso(d.gate.claveActualizada);
      } catch (err) {
        if (err instanceof FirebaseError) {
          setError(
            err.code === "auth/too-many-requests"
              ? d.gate.intentos
              : err.code === "auth/weak-password"
                ? d.registro.errorDebil
                : err.code === "auth/requires-recent-login"
                  ? d.gate.sesionCaducada
                  : d.gate.claveNoActualizada,
          );
        } else if (err instanceof Error && err.message) {
          setError(err.message);
        } else {
          setError(d.gate.claveNoActualizada);
        }
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col justify-center px-4 py-10">
        <h1 className="mb-1 text-2xl font-bold">{d.gate.cambiarClave_t}</h1>
        <p className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
          {d.gate.claveTemporal}
        </p>
        <form onSubmit={onChangePassword} className="space-y-4">
          <div>
            <label htmlFor="clave-nueva" className="mb-1 block text-sm font-medium">
              {d.gate.claveNueva}
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
              {d.gate.claveRepetir}
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
            {busy ? d.gate.guardando : d.gate.guardarClave}
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
        setRegistroAviso(null);
        setAviso(d.gate.correoReenviado);
      } catch (err) {
        setError(
          err instanceof FirebaseError && err.code === "auth/too-many-requests"
            ? d.gate.correosSeguidos
            : d.gate.correoNoReenviado,
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
          setError(d.gate.verificarAun);
        }
      } catch {
        setError(d.gate.comprobarNo);
      } finally {
        setBusy(false);
      }
    }

    return (
      <div className="mx-auto flex min-h-[60dvh] max-w-sm flex-col justify-center px-4 py-10">
        <h1 className="mb-1 text-2xl font-bold">{d.gate.verifica_t}</h1>
        <p className="mb-4 text-sm text-neutral-500 dark:text-neutral-400">
          {d.gate.enviadoPre}
          <span className="font-semibold break-all">{user.email}</span>
          {d.gate.enviadoSuf}
        </p>

        {registroAviso && (
          <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:bg-amber-950 dark:text-amber-200">
            {registroAviso}
          </p>
        )}

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
            {busy ? d.gate.comprobando : d.gate.yaVerificado}
          </button>
          <button
            type="button"
            onClick={onResend}
            disabled={busy}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-900"
          >
            {d.gate.reenviar}
          </button>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full px-4 py-2 text-sm text-neutral-500 underline dark:text-neutral-400"
          >
            {d.gate.salir}
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
