import type { Metadata } from "next";
import { IrAIdioma } from "@/components/i18n/ir-a-idioma";
import { REDIRECT_METADATA } from "@/i18n/meta";

export const metadata: Metadata = {
  ...REDIRECT_METADATA,
  title: "Términos de uso",
};

/** URL antigua: redirige a /es/terminos o /eu/terminos. */
export default function TerminosPage() {
  return <IrAIdioma ruta="/terminos" />;
}
