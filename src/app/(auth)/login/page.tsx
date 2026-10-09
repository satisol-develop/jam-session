import type { Metadata } from "next";
import { IrAIdioma } from "@/components/i18n/ir-a-idioma";
import { REDIRECT_METADATA } from "@/i18n/meta";

export const metadata: Metadata = {
  ...REDIRECT_METADATA,
  title: "Entrar",
};

/** URL antigua: redirige a /es/login o /eu/login (cookie → navegador → es). */
export default function LoginPage() {
  return <IrAIdioma ruta="/login" />;
}
