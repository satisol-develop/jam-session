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

export default function MiZonaPage() {
  const { user, roles } = useAuth();
  const { pendiente } = useRequireAuth();
  const router = useRouter();
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
      .then((d) => setTurnos(d.turnos ?? []))
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
        Cargando…
      </div>
    );
  }

  if (esAdmin) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-neutral-500 dark:text-neutral-400">
        Abriendo tu panel…
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

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold">Mi zona</h1>
        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
          Hola, {user?.displayName ?? user?.email ?? "músico"}.
          {evento
            ? evento.inscripcionesCerradas
              ? ` Inscripciones cerradas: ${evento.titulo || "Jam Session"}.`
              : ` Inscripción abierta: ${evento.titulo || "Jam Session"}.`
            : ""}
        </p>
        {!evento && (
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

      {turnos === null ? (
        <SkeletonFilas n={2} />
      ) : turnos.length > 0 ? (
        <section className="rounded-2xl border border-neutral-200 p-5 dark:border-neutral-800">
          <h2 className="text-xl font-bold">Escaleta en directo</h2>
          <p className="mb-3 mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Próximos turnos de la Jam, según los actualiza el Stage Manager.
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
                      En escena
                    </span>
                  )}
                </li>
              ))}
          </ul>
        </section>
      ) : (
        <section className="rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
          La escaleta aún no se ha publicado. Aparecerá aquí en cuanto el
          Stage Manager monte los turnos de la sesión.
        </section>
      )}

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
                <span className="font-medium">
                  {ROLES_META[rol as keyof typeof ROLES_META]?.label ?? rol}
                </span>
                <span className="text-neutral-500 dark:text-neutral-400">
                  {" "}
                  · {tipo === "titular" ? "titular" : "apoyo"}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
