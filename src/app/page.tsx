import type { Metadata } from "next";
import { IrAIdioma } from "@/components/i18n/ir-a-idioma";

/**
 * Raíz sin idioma: redirige a /es/ o /eu/ según la cookie de preferencia o
 * el idioma del navegador (y sin JavaScript ofrece los dos enlaces). El
 * contenido real vive en /[locale]/.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default function RootPage() {
  return <IrAIdioma ruta="" />;
}
