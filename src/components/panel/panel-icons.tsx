import type { ReactNode } from "react";

const ICONS: Record<string, ReactNode> = {
  inicio: <path d="M3.5 10.5 12 3.5l8.5 7M6 9.5V20.5h12V9.5M10 20.5v-5h4v5" />,
  tareas: (
    <path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5M4 6.1l1.3 1.3L7.6 5.1M4 12.1l1.3 1.3L7.6 11.1M4 18.1l1.3 1.3L7.6 17.1" />
  ),
  inscripciones: (
    <path d="M14.5 20.5v-1.7a3.8 3.8 0 0 0-3.8-3.8H6.3a3.8 3.8 0 0 0-3.8 3.8v1.7M8.5 11.8a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4M18.5 8.5v6M15.5 11.5h6" />
  ),
  propuestas: (
    <>
      <path d="M9 17.5V5.8l10-2v11.7" />
      <circle cx="6.4" cy="17.6" r="2.6" />
      <circle cx="16.4" cy="15.5" r="2.6" />
    </>
  ),
  instrumentos: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9.5 21h5" />
    </>
  ),
  caja: (
    <>
      <rect x="3" y="6.5" width="18" height="12.5" rx="2.5" />
      <path d="M3 10.5h18M16 14.8h2.2" />
    </>
  ),
  auditoria: (
    <>
      <rect x="2.5" y="6" width="19" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M6 10v4M18 10v4" />
    </>
  ),
  historial: (
    <>
      <rect x="3.5" y="4" width="17" height="4.5" rx="1.2" />
      <path d="M5.5 8.5V19a1.8 1.8 0 0 0 1.8 1.8h9.4A1.8 1.8 0 0 0 18.5 19V8.5M10 12.5h4" />
    </>
  ),
  rotacion: <path d="M20 12a8 8 0 1 1-2.4-5.7M20.5 3.8v4.7h-4.7" />,
  sesion: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 10h17M8 3.2v3.6M16 3.2v3.6" />
    </>
  ),
  "grupo-base": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-1.1A4.4 4.4 0 0 1 6.9 14.5h4.2a4.4 4.4 0 0 1 4.4 4.4V20M15.5 5a3.5 3.5 0 0 1 0 6.8M17.2 14.7a4.4 4.4 0 0 1 4.3 4.3v1.5" />
    </>
  ),
  escaleta: (
    <>
      <path d="M9.5 6h10.5M9.5 12h10.5M9.5 18h10.5" />
      <path d="M4 4.8h1.8v3.4M3.4 17.8h2.6c0-1.1-.7-1.8-1.5-1.8s-1.5.6-1.5 1.5c0 1.4 3.2 2.4 3.2 3.4H3.6M3.6 13.4h2.2" />
    </>
  ),
  ensayo: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.2V12l3.2 2.1" />
    </>
  ),
  difusion: (
    <>
      <path d="M4 10.2v3.6a1.4 1.4 0 0 0 1.4 1.4H7l7 4.6V5.6L7 10.2H5.4A1.4 1.4 0 0 0 4 11.6z" />
      <path d="M17.8 8.8a4.6 4.6 0 0 1 0 6.4" />
    </>
  ),
  apoyos: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20v-1.1A4.4 4.4 0 0 1 6.9 14.5h4.2a4.4 4.4 0 0 1 4.2 3.1M15.3 17.6l2 2 4.2-4.6" />
    </>
  ),
  mas: (
    <>
      <circle cx="5" cy="12" r="1.5" />
      <circle cx="12" cy="12" r="1.5" />
      <circle cx="19" cy="12" r="1.5" />
    </>
  ),
};

const FALLBACK = <path d="M5 12h14" />;

export function TabIcon({
  id,
  className = "size-5",
}: {
  id: string;
  className?: string;
}) {
  const contenido = ICONS[id] ?? FALLBACK;
  const relleno = id === "mas" ? "currentColor" : "none";
  return (
    <svg
      viewBox="0 0 24 24"
      fill={relleno}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {contenido}
    </svg>
  );
}
