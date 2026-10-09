import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, hasLocale, locales } from "@/i18n";
import { alternatesLocale } from "@/i18n/meta";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

/** Descripción e hreflang por defecto para toda la parte pública localizada. */
export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    description: getDict(locale).landing.metaDesc,
    alternates: alternatesLocale("/"),
  };
}

/**
 * Raíz de la parte pública localizada (/es/… y /eu/…). El <html> lo pinta
 * el layout raíz (compartido con los paneles); el idioma se sincroniza con
 * <LangSync>. Fuera de es, eu → 404.
 */
export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <>{children}</>;
}
