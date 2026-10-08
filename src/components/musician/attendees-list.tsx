"use client";

import { useEffect, useState } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";

interface Asistente {
  uid: string;
  nombre: string;
}

export function AttendeesList() {
  const [asistentes, setAsistentes] = useState<Asistente[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ usuarios: Asistente[] }>("musician.attendees")
      .then((d) => setAsistentes(d.usuarios ?? []))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar."),
      );
  }, []);

  if (error) {
    return (
      <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
        {error}
      </p>
    );
  }
  if (asistentes === null) {
    return <SkeletonFilas n={4} />;
  }
  if (asistentes.length === 0) {
    return (
      <p className="text-sm text-neutral-500 dark:text-neutral-400">
        Nadie se ha inscrito todavía. ¡Sé el primero!
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {asistentes.map((a) => (
        <li
          key={a.uid}
          className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
        >
          <span className="flex size-7 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white dark:bg-white dark:text-black">
            {(a.nombre || "?").slice(0, 1).toUpperCase()}
          </span>
          <span className="font-medium">{a.nombre || "Músico"}</span>
        </li>
      ))}
    </ul>
  );
}
