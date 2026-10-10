"use client";

import { ErrorPagina } from "@/components/error-pagina";

export default function ErrorRaiz({ reset }: { reset: () => void }) {
  return <ErrorPagina onReintentar={reset} />;
}
