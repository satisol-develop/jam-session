import type { Metadata } from "next";
import { IrAIdioma } from "@/components/i18n/ir-a-idioma";
import { REDIRECT_METADATA } from "@/i18n/meta";

export const metadata: Metadata = {
  ...REDIRECT_METADATA,
  title: "Política de privacidad",
};

/** URL antigua: redirige a /es/privacidad o /eu/privacidad. */
export default function PrivacidadPage() {
  return <IrAIdioma ruta="/privacidad" />;
}
