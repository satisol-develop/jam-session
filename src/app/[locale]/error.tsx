"use client";

import { ErrorPagina } from "@/components/error-pagina";

export default function ErrorLocale({ reset }: { reset: () => void }) {
  return <ErrorPagina onReintentar={reset} />;
}
