"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES } from "@/types";
import type { EventoPublico } from "@/types";

function formatFecha(fecha: string): string {
  if (!fecha) return "";
  const d = new Date(fecha);
  if (!Number.isNaN(d.getTime())) {
    return d.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return fecha;
}

function formatEnsayo(valor: string): string {
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return `${d.toLocaleDateString("es-ES", { day: "numeric", month: "long" })} · ${d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
}

export default function Home() {
  const { user, roles } = useAuth();
  const tieneRoles = ROLES.some((r) => roles[r]);
  const [data, setData] = useState<EventoPublico | null>(null);
  const [cargando, setCargado] = useState(true);

  useEffect(() => {
    let vivo = true;
    api<EventoPublico>("public.event")
      .then((res) => {
        if (vivo) setData(res);
      })
      .catch(() => {
        // Sin backend: se muestran los textos por defecto (estado vacío).
      })
      .finally(() => {
        if (vivo) setCargado(false);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const evento = data?.evento ?? null;
  const catalogo = data?.catalogo ?? [];
  const top = data?.masTocadas ?? [];
  const hayTop = top.length > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:py-14">
      <section className="text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-red-500">
          {evento?.estado === "realizado" ? "Última sesión" : "Próxima sesión"}
        </p>
        <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
          {evento?.titulo || "Jam Session"}
        </h1>
        {evento && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="rounded-full bg-neutral-900 px-4 py-1.5 font-medium text-white dark:bg-white dark:text-black">
              {formatFecha(evento.fecha)}
            </span>
            {evento.hora && (
              <span className="rounded-full border border-neutral-300 px-4 py-1.5 font-medium dark:border-neutral-700">
                {evento.hora}
              </span>
            )}
            {evento.lugar && (
              <span className="rounded-full border border-neutral-300 px-4 py-1.5 font-medium dark:border-neutral-700">
                {evento.lugar}
              </span>
            )}
            {evento.ensayo && (
              <span className="rounded-full border border-red-500 px-4 py-1.5 font-medium text-red-500">
                Ensayo general: {formatEnsayo(evento.ensayo)}
              </span>
            )}
          </div>
        )}
      </section>

      <section className="mt-10">
        {evento?.cartelUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={evento.cartelUrl}
            alt={`Cartel de ${evento.titulo}`}
            width={1200}
            height={1600}
            loading="lazy"
            decoding="async"
            className="mx-auto w-full max-w-lg rounded-2xl border border-neutral-200 shadow-sm dark:border-neutral-800"
          />
        ) : (
          <div className="mx-auto flex h-64 w-full max-w-lg items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-gradient-to-br from-red-500/10 via-transparent to-amber-500/10 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {cargando ? "Cargando cartel…" : "El cartel del mes se publicará aquí"}
          </div>
        )}
      </section>

      <section className="mt-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-bold">
            {hayTop ? "Las más tocadas" : "Repertorio del mes"}
          </h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {hayTop
              ? "por número de sesiones"
              : `${catalogo.length} ${catalogo.length === 1 ? "tema" : "temas"}`}
          </span>
        </div>

        {hayTop ? (
          <ol className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {top.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-4 px-4 py-3 sm:px-6"
              >
                <span className="w-6 shrink-0 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.titulo}
                </span>
                <span className="min-w-0 max-w-[40%] shrink truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {c.artista || "—"}
                </span>
                <span className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold tabular-nums text-neutral-600 dark:border-neutral-700 dark:text-neutral-300">
                  {c.veces} {c.veces === 1 ? "sesión" : "sesiones"}
                </span>
              </li>
            ))}
          </ol>
        ) : catalogo.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
            {cargando
              ? "Cargando repertorio…"
              : "El repertorio estará disponible en breve."}
          </p>
        ) : (
          <ol className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
            {catalogo.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-4 px-4 py-3 sm:px-6"
              >
                <span className="w-6 shrink-0 text-sm tabular-nums text-neutral-500 dark:text-neutral-400">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.titulo}
                </span>
                <span className="min-w-0 max-w-[40%] shrink truncate text-sm text-neutral-500 dark:text-neutral-400">
                  {c.artista || "—"}
                </span>
                {c.tonalidad && (
                  <span className="hidden rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold sm:block dark:bg-neutral-900">
                    {c.tonalidad}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        <Link
          href="/partituras"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-red-500 underline-offset-4 hover:underline"
        >
          Ver todo el repertorio →
        </Link>
      </section>

      <section className="mt-12 rounded-2xl bg-neutral-900 p-8 text-center text-white dark:bg-neutral-100 dark:text-black">
        <h2 className="text-lg font-bold">¿Tocas un instrumento?</h2>
        <p className="mx-auto mt-2 max-w-md text-sm opacity-80">
          Regístrate, solicita los temas en los que quieres participar y consulta
          el material de estudio.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {user ? (
            <Link
              href={tieneRoles ? "/panel" : "/mi"}
              className="rounded-lg bg-[#FFE600] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white"
            >
              {tieneRoles ? "Mi panel" : "Mi zona"}
            </Link>
          ) : (
            <>
              <Link
                href="/registro"
                className="rounded-lg bg-[#FFE600] px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-white"
              >
                Inscribirme
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-semibold transition hover:bg-white/10 dark:border-black/30 dark:hover:bg-black/5"
              >
                Entrar
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
