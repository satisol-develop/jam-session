"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { CartelFake } from "@/components/marketing/cartel-fake";
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

/** Fecha corta para el cartel: "sáb 25 oct · 20:30". */
function formatFechaCartel(fecha: string, hora: string): string {
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "";
  const dia = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  const fechaCorta = d
    .toLocaleDateString("es-ES", { day: "numeric", month: "short" })
    .replace(".", "");
  return `${dia} ${fechaCorta} · ${hora || "20:30"}`;
}

const PASOS = [
  {
    titulo: "Crea tu cuenta",
    texto: "Regístrate con tu correo y vérificalo. Sin cuotas ni letra pequeña.",
  },
  {
    titulo: "Elige qué tocas",
    texto: "Instrumentos y los temas de los que quieres participar en la jam.",
  },
  {
    titulo: "Ensayo general",
    texto: "El grupo base cierra las inscripciones y se ensaya antes del directo.",
  },
  {
    titulo: "¡A escenario!",
    texto: "Escaleta en directo y Jam Session con el resto de músicos.",
  },
];

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
    <div className="overflow-x-clip">
      {/* ============================ HERO ============================ */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 12% -10%, rgba(255,230,0,0.35), transparent 60%), radial-gradient(ellipse 45% 40% at 108% 15%, rgba(239,68,68,0.16), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-5xl items-center gap-10 px-4 py-12 sm:py-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
              Debarock Kolektiboa presenta
            </p>
            <h1 className="mt-4 text-6xl leading-[0.85] font-black tracking-tight text-neutral-950 uppercase italic sm:text-8xl">
              Jam
              <br />
              <span className="inline-block -rotate-1 bg-[#FFE600] px-3 pb-1">
                Session
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-neutral-600 sm:text-lg">
              Toca, comparte y sube al escenario. Elige los temas en los que
              quieres participar, ensayamos juntos y la Jam Session lo pone todo
              en directo.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm">
              {evento ? (
                <>
                  <span className="rounded-full bg-neutral-950 px-4 py-1.5 font-semibold text-white">
                    {evento.estado === "realizado"
                      ? "Última sesión"
                      : "Próxima sesión"}
                  </span>
                  <span className="rounded-full border border-neutral-300 px-4 py-1.5 font-medium text-neutral-700">
                    {formatFecha(evento.fecha)}
                  </span>
                  {evento.hora && (
                    <span className="rounded-full border border-neutral-300 px-4 py-1.5 font-medium text-neutral-700">
                      {evento.hora}
                    </span>
                  )}
                  {evento.lugar && (
                    <span className="rounded-full border border-neutral-300 px-4 py-1.5 font-medium text-neutral-700">
                      {evento.lugar}
                    </span>
                  )}
                  {evento.ensayo && (
                    <span className="rounded-full border border-red-500 px-4 py-1.5 font-medium text-red-500">
                      Ensayo general: {formatEnsayo(evento.ensayo)}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="rounded-full bg-neutral-950 px-4 py-1.5 font-semibold text-white">
                    Próxima sesión
                  </span>
                  <span className="rounded-full border border-neutral-300 px-4 py-1.5 font-medium text-neutral-600">
                    {cargando ? "Cargando…" : "Se anuncia aquí muy pronto"}
                  </span>
                </>
              )}
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              {user ? (
                <Link
                  href={tieneRoles ? "/panel" : "/mi"}
                  className="inline-flex min-h-11 items-center rounded-xl bg-[#FFE600] px-6 text-sm font-extrabold tracking-wide text-black uppercase transition hover:bg-neutral-950 hover:text-[#FFE600]"
                >
                  {tieneRoles ? "Mi panel" : "Mi zona"}
                </Link>
              ) : (
                <>
                  <Link
                    href="/registro"
                    className="inline-flex min-h-11 items-center rounded-xl bg-[#FFE600] px-6 text-sm font-extrabold tracking-wide text-black uppercase transition hover:bg-neutral-950 hover:text-[#FFE600]"
                  >
                    Inscribirme
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center rounded-xl border-2 border-neutral-950 px-6 text-sm font-extrabold tracking-wide text-neutral-950 uppercase transition hover:bg-neutral-950 hover:text-white"
                  >
                    Entrar
                  </Link>
                </>
              )}
              <Link
                href="/partituras"
                className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-neutral-600 underline-offset-4 transition hover:text-red-500 hover:underline"
              >
                Ver repertorio →
              </Link>
            </div>
          </div>

          {/* Cartel: real si existe; si no, el ficticio (nunca hueco vacío) */}
          <div className="group relative mx-auto w-full max-w-sm -rotate-[1.5deg] transition-transform duration-300 hover:rotate-0">
            <span
              aria-hidden
              className="absolute -top-3 left-6 h-7 w-24 -rotate-6 bg-amber-200/80 shadow-sm"
            />
            <span
              aria-hidden
              className="absolute -right-3 -bottom-3 h-7 w-24 rotate-3 bg-amber-200/80 shadow-sm"
            />
            <div className="overflow-hidden rounded-xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)] ring-1 ring-neutral-900/10">
              {evento?.cartelUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={evento.cartelUrl}
                  alt={`Cartel de ${evento.titulo}`}
                  width={1200}
                  height={1600}
                  loading="eager"
                  decoding="async"
                  className="w-full"
                />
              ) : (
                <CartelFake
                  fecha={
                    evento
                      ? formatFechaCartel(evento.fecha, evento.hora ?? "")
                      : undefined
                  }
                  lugar={evento?.lugar || undefined}
                  className="w-full"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ========================= CÓMO FUNCIONA ======================== */}
      <section className="border-t border-neutral-200 bg-neutral-50/70">
        <div className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
          <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
            Así funciona
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-950 uppercase italic sm:text-4xl">
            De cero a la jam en 4 pasos
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PASOS.map((p, i) => (
              <li
                key={p.titulo}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-[#FFE600] hover:shadow-md"
              >
                <span className="inline-flex size-9 items-center justify-center rounded-lg bg-[#FFE600] font-black text-neutral-950">
                  {i + 1}
                </span>
                <h3 className="mt-3 font-black tracking-tight text-neutral-950 uppercase italic">
                  {p.titulo}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">
                  {p.texto}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ========================== REPERTORIO ========================= */}
      <section className="mx-auto max-w-5xl px-4 py-12 sm:py-16">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold tracking-[0.22em] text-red-500 uppercase">
              Qué tocamos
            </p>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 uppercase italic sm:text-3xl">
              {hayTop ? "Las más tocadas" : "Repertorio del mes"}
            </h2>
          </div>
          <span className="shrink-0 text-sm text-neutral-500">
            {hayTop
              ? "por número de sesiones"
              : `${catalogo.length} ${catalogo.length === 1 ? "tema" : "temas"}`}
          </span>
        </div>

        {hayTop ? (
          <ol className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {top.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-4 px-4 py-3 sm:px-6"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-neutral-950 text-[11px] font-black text-[#FFE600] tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.titulo}
                </span>
                <span className="min-w-0 max-w-[40%] shrink truncate text-sm text-neutral-500">
                  {c.artista || "—"}
                </span>
                <span className="shrink-0 rounded-full border border-neutral-200 px-2.5 py-0.5 text-xs font-semibold text-neutral-600 tabular-nums">
                  {c.veces} {c.veces === 1 ? "sesión" : "sesiones"}
                </span>
              </li>
            ))}
          </ol>
        ) : catalogo.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">
            {cargando
              ? "Cargando repertorio…"
              : "El repertorio estará disponible en breve."}
          </p>
        ) : (
          <ol className="divide-y divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {catalogo.map((c, i) => (
              <li
                key={c.id}
                className="flex items-center gap-4 px-4 py-3 sm:px-6"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded bg-neutral-950 text-[11px] font-black text-[#FFE600] tabular-nums">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {c.titulo}
                </span>
                <span className="min-w-0 max-w-[40%] shrink truncate text-sm text-neutral-500">
                  {c.artista || "—"}
                </span>
                {c.tonalidad && (
                  <span className="hidden rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold sm:block">
                    {c.tonalidad}
                  </span>
                )}
              </li>
            ))}
          </ol>
        )}

        <Link
          href="/partituras"
          className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-red-500 underline-offset-4 hover:underline"
        >
          Ver todo el repertorio →
        </Link>
      </section>

      {/* ============================= CTA ============================ */}
      <section className="mx-auto max-w-5xl px-4 pb-14">
        <div className="rounded-3xl bg-neutral-950 px-6 py-10 text-center text-white sm:px-10">
          <p className="text-xs font-extrabold tracking-[0.22em] text-[#FFE600] uppercase">
            La jam te espera
          </p>
          <h2 className="mt-3 text-2xl font-black uppercase italic sm:text-3xl">
            ¿Tocas un instrumento?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
            Regístrate, solicita los temas en los que quieres participar y
            consulta el material de estudio. La próxima jam puede ser la tuya.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {user ? (
              <Link
                href={tieneRoles ? "/panel" : "/mi"}
                className="inline-flex min-h-11 items-center rounded-xl bg-[#FFE600] px-6 text-sm font-extrabold tracking-wide text-black uppercase transition hover:bg-white"
              >
                {tieneRoles ? "Mi panel" : "Mi zona"}
              </Link>
            ) : (
              <>
                <Link
                  href="/registro"
                  className="inline-flex min-h-11 items-center rounded-xl bg-[#FFE600] px-6 text-sm font-extrabold tracking-wide text-black uppercase transition hover:bg-white"
                >
                  Inscribirme
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center rounded-xl border border-white/40 px-6 text-sm font-extrabold tracking-wide uppercase transition hover:border-[#FFE600] hover:text-[#FFE600]"
                >
                  Entrar
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
