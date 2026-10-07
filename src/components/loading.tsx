"use client";

/**
 * Estados de carga compartidos:
 * - `PantallaCargando`: cargador a pantalla completa mientras se ejecuta el
 *   primer lote de endpoints (no se pinta el interior hasta que terminen).
 * - `Skeleton` / `SkeletonFilas`: placeholders pulsados para lo que va
 *   llegando después (se adaptan al tema claro y a la zona db-* oscura).
 */

export function PantallaCargando({ texto }: { texto: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-white dark:bg-black"
    >
      <span
        aria-hidden
        className="size-10 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900 dark:border-neutral-800 dark:border-t-[#FFE600]"
      />
      <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
        {texto}
      </p>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-neutral-200 dark:bg-white/10 ${className}`}
    />
  );
}

export function SkeletonFilas({
  n = 3,
  alto = "h-14",
}: {
  n?: number;
  alto?: string;
}) {
  return (
    <div role="status" aria-label="Cargando" className="space-y-2">
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className={`w-full ${alto} rounded-xl`} />
      ))}
    </div>
  );
}
