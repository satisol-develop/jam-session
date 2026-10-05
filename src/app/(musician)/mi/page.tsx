"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import { SubscribeForm } from "@/components/musician/subscribe-form";
import { ProposeForm } from "@/components/musician/propose-form";
import { AttendeesList } from "@/components/musician/attendees-list";
import type { Evento, Inscripcion } from "@/types";

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
        <p className="mb-4 mt-1 text-sm text-neutral-500">{description}</p>
      )}
      <div className={description ? "" : "mt-4"}>{children}</div>
    </section>
  );
}

export default function MiZonaPage() {
  const { user, roles } = useAuth();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [inscripcion, setInscripcion] = useState<Inscripcion | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
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
  }, []);

  const roleEntries = Object.entries(roles);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold">Mi zona</h1>
        <p className="mt-1 text-neutral-500">
          Hola, {user?.displayName ?? user?.email ?? "músico"}.
          {evento
            ? evento.inscripcionesCerradas
              ? ` Inscripciones cerradas: ${evento.titulo || "Jam Session"}.`
              : ` Inscripción abierta: ${evento.titulo || "Jam Session"}.`
            : ""}
        </p>
        {!cargado && <p className="mt-2 text-sm text-neutral-500">Cargando…</p>}
        {cargado && !evento && (
          <p className="mt-2 text-sm text-amber-600">
            No hay ningún evento activo ahora mismo.
          </p>
        )}
      </header>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/partituras"
          className="rounded-lg border border-neutral-300 px-4 py-2.5 font-medium transition hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-900"
        >
          Partituras y material
        </Link>
        {roleEntries.length > 0 && (
          <Link
            href="/panel"
            className="rounded-lg bg-neutral-900 px-4 py-2.5 font-medium text-white transition hover:bg-neutral-700 dark:bg-white dark:text-black"
          >
            Paneles del equipo
          </Link>
        )}
      </div>

      <Section
        title="Inscripción"
        description={
          evento?.inscripcionesCerradas
            ? "Inscripciones cerradas por el Grupo Base."
            : "Elige instrumentos y temas en los que quieres tocar."
        }
      >
        <SubscribeForm
          key={inscripcion?.id ?? "sin-inscripcion"}
          inscripcion={inscripcion}
          onSaved={setInscripcion}
          cerradas={evento?.inscripcionesCerradas ?? false}
          ensayo={evento?.ensayo || undefined}
        />
      </Section>

      <Section
        title="Propuestas de temas"
        description="¿Echa de menos algún tema? Proponlo."
      >
        <ProposeForm />
      </Section>

      <Section
        title="Asistentes confirmados"
        description="Lista de músicos inscritos (solo lectura)."
      >
        <AttendeesList />
      </Section>

      {roleEntries.length > 0 && (
        <Section title="Tus roles">
          <ul className="space-y-1 text-sm">
            {roleEntries.map(([rol, tipo]) => (
              <li key={rol}>
                <span className="font-medium">{rol}</span>
                <span className="text-neutral-500"> · {tipo}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
