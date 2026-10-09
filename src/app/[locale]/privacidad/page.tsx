import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrivacidadEu, PrivacidadEs } from "./contenido";
import { getDict, hasLocale, type Locale } from "@/i18n";
import { alternatesPara } from "@/i18n/meta";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacidad">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: getDict(locale).legales.privacidad,
    alternates: alternatesPara(locale, "/privacidad"),
  };
}

export default async function PrivacidadPage({
  params,
}: PageProps<"/[locale]/privacidad">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <PrivacidadContenido locale={locale} />;
}

function PrivacidadContenido({ locale }: { locale: Locale }) {
  return locale === "eu" ? <PrivacidadEu /> : <PrivacidadEs />;
}
