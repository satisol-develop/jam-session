import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TerminosEu, TerminosEs } from "./contenido";
import { getDict, hasLocale, rutaLocalizada } from "@/i18n";
import { alternatesPara } from "@/i18n/meta";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/terminos">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: getDict(locale).legales.terminos,
    alternates: alternatesPara(locale, "/terminos"),
  };
}

export default async function TerminosPage({
  params,
}: PageProps<"/[locale]/terminos">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  const privacidad = rutaLocalizada(locale, "/privacidad");
  return locale === "eu" ? (
    <TerminosEu privacidad={privacidad} />
  ) : (
    <TerminosEs privacidad={privacidad} />
  );
}
