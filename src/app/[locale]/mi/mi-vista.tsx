"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { api } from "@/lib/api/client";
import { ROLES_META } from "@/lib/constants";
import { SubscribeForm } from "@/components/musician/subscribe-form";
import { ProposeForm } from "@/components/musician/propose-form";
import { AttendeesList } from "@/components/musician/attendees-list";
import { Skeleton, SkeletonFilas } from "@/components/loading";
import { fmt, rutaLocalizada } from "@/i18n";
import { useDict, useLocale } from "@/i18n/use-locale";
import type { Evento, Inscripcion, Turno } from "@/types";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800 sm:p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && (
        <p className="mb-4 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      )}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export function MiVista() {
  const { user, roles } = useAuth();
  const { pendiente } = useRequireAuth();
  const router = useRouter();
  const locale = useLocale();
  const d = useDict();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [cargado, setCargado] = useState(false);
  const [turnos, setTurnos] = useState<Turno[] | null>(null);

  // Mi zona es para participantes: el admin es el único rol que no
  // participa, así que él solo se redirige a su panel.
  const esAdmin = Boolean(roles.admin);
  useEffect(() => {
    if (!pendiente && esAdmin) router.replace("/panel");
  }, [pendiente, esAdmin, router]);

  // Escaleta en directo (se muestra sola a medida que llega).
  useEffect(() => {
    api<{ turnos: Turno[] }>("escaleta.list")
      .then((d2) => setTurnos(d2.turnos ?? []))
      .catch(() => setTurnos([]));
  }, []);

  useEffect(() => {
    // Salvaguarda: a los 12 s se pinta la zona aunque un endpoint tarde;
    // lo que llegue después sobrescribe.
    const salvamento = setTimeout(() => setCargado(true), 12000);
    Promise.all([
      api<{ evento: Evento | null }>("public.event"),
      api<{ inscripcion: Inscripcion | null }>("musician.subscription"),
    ])
      .then(([ev, sub]) => {
        setEvento(ev.evento ?? null);
        setInscripcion(sub.inscripcion ?? null);
      })
      .catch(() => undefined)
      .finally(() => setCargado(true));
    return () => clearTimeout(salvamento);
  }, []);

  if (pendiente) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-500 dark:text-neutral-400">
        {d.mi.cargando}
      </div>
    );
  }

  if (esAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-500 dark:text-neutral-400">
        {d.mi.abriendoPanel}
      </div>
    );
  }

  // Primer lote de endpoints: en cuanto lleguen roles y correo verificado
  // (gate) se pinta la zona con skeletons, sin pantalla completa.
  if (!cargado) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
        <header>
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="mt-3 h-4 w-3/4 rounded-lg" />
        </header>
        <SkeletonFilas n={3} />
      </div>
    );
  }

  const roleEntries = Object.entries(roles);
  const nombre = user?.displayName ?? user?.email ?? d.mi.musico;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold">{d.mi.titulo}</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          {fmt(d.mi.saludo, { nombre })}
          {evento
            ? ` ${
                evento.inscripcionesCerradas
                  ? fmt(d.mi.eventoCerradas, {
                      t: evento.titulo || "Jam Session",
                    })
                  : fmt(d.mi.eventoAbierta, {
                      t: evento.titulo || "Jam Session",
                    })
              }`
            : ""}
        </p>
        {!evento && (
          <p className="mt-2 text-sm text-amber-600">{d.mi.sinEvento}</p>
        )}
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href={rutaLocalizada(locale, "/partituras")}
          className="rounded-lg border border-neutral-300 px-4 py-2.5 font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          {d.mi.partituras}
        </Link>
        {roleEntries.length > 0 && (
          <Link
            href="/panel"
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black"
          >
            {d.mi.paneles}
          </Link>
        )}
      </div>

      {turnos === null ? (
        <SkeletonFilas n={2} />
      ) : turnos.length > 0 ? (
        <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-xl font-bold">{d.mi.escaletaTitulo}</h2>
          <p className="mb-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            {d.mi.escaletaDesc}
          </p>
          <ul className="space-y-2">
            {turnos
              .slice(
                Math.max(
                  0,
                  turnos.findIndex((t) => t.estado === "escena"),
                ),
                Math.max(0, turnos.findIndex((t) => t.estado === "escena")) + 4,
              )
              .map((t) => (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-700"
                >
                  <span className="shrink-0 tabular-nums text-xs text-neutral-500 dark:text-neutral-400">
                    {t.orden}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="font-semibold">{t.titulo || "—"}</span>
                    {t.interpretes && (
                      <span className="ml-2 text-neutral-500 dark:text-neutral-400">
                        · {t.interpretes}
                      </span>
                    )}
                  </span>
                  {t.estado === "escena" && (
                    <span className="shrink-0 rounded bg-[#FFE600] px-1.5 py-0.5 text-[11px] font-bold uppercase text-black">
                      {d.mi.enEscena}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          {d.mi.escaletaVacia}
        </section>
      )}

      <Section
        title={d.mi.inscripcion.titulo}
        description={
          !evento
            ? d.mi.inscripcion.descSinSesion
            : evento.inscripcionesCerradas
              ? d.mi.inscripcion.descCerradas
              : d.mi.inscripcion.descAbierta
        }
      >
        <SubscribeForm
          key={inscripcion?.id ?? "sin-inscripcion"}
          inscripcion={inscripcion}
          onSaved={setInscripcion}
          sinSesion={!evento}
          cerradas={evento?.inscripcionesCerradas ?? false}
          ensayo={evento?.ensayo || undefined}
        />
      </Section>

      <Section
        title={d.mi.propuestas.titulo}
        description={d.mi.propuestas.desc}
      >
        <ProposeForm />
      </Section>

      <Section
        title={d.mi.asistentes.titulo}
        description={d.mi.asistentes.desc}
      >
        <AttendeesList />
      </Section>

      {roleEntries.length > 0 && (
        <Section title={d.mi.roles.titulo}>
          <ul className="space-y-1 text-sm">
            {roleEntries.map(([rol, tipo]) => (
              <li key={rol}>
                <span className="font-medium">
                  {ROLES_META[rol as keyof typeof ROLES_META]?.label ?? rol}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {" "}
                  ·{" "}
                  {tipo === "titular" ? d.mi.roles.titular : d.mi.roles.apoyo}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
