import type { Metadata } from "next";
import { IrAIdioma } from "@/components/i18n/ir-a-idioma";
import { REDIRECT_METADATA } from "@/i18n/meta";

export const metadata: Metadata = {
  ...REDIRECT_METADATA,
  title: "Crear cuenta",
};

/** URL antigua: redirige a /es/registro o /eu/registro. */
export default function RegistroPage() {
  return <IrAIdioma ruta="/registro" />;
}
