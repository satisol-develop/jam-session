"use client";

import { useDict } from "@/i18n/use-locale";

/**
 * Alterna el modo oscuro global: añade/quita la clase `.dark` en <html>
 * y la recuerda en localStorage. El estado inicial lo decide un script
 * inline en el layout (preferencia guardada o la del sistema).
 * `enPanel` adapta los estilos al header oscuro de /panel (que no lleva
 * la clase `.dark`, así que las variantes `dark:` no le alcanzan).
 */
export function ThemeToggle({ enPanel = false }: { enPanel?: boolean }) {
  const d = useDict();
  function toggle() {
    const raiz = document.documentElement;
    const oscuro = !raiz.classList.contains("dark");
    raiz.classList.toggle("dark", oscuro);
    try {
      localStorage.setItem("jam-theme", oscuro ? "dark" : "light");
    } catch {
      /* almacenamiento no disponible */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={d.header.tema}
      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg p-2 transition ${
        enPanel
          ? "text-white/60 hover:bg-white/10 hover:text-white"
          : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-900 dark:hover:text-white"
      }`}
    >
      {/* Luna (se muestra en claro → clic = oscuro) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="size-4.5 dark:hidden"
      >
        <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5" />
      </svg>
      {/* Sol (se muestra en oscuro → clic = claro) */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="hidden size-4.5 dark:block"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" />
      </svg>
    </button>
  );
}
