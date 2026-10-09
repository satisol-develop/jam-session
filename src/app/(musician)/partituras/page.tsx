import type { Metadata } from "next";
import { IrAIdioma } from "@/components/i18n/ir-a-idioma";
import { REDIRECT_METADATA } from "@/i18n/meta";

export const metadata: Metadata = {
  ...REDIRECT_METADATA,
  title: "Partituras y material",
};

/** URL antigua: redirige a /es/partituras o /eu/partituras. */
export default function PartiturasPage() {
  return <IrAIdioma ruta="/partituras" />;
}
