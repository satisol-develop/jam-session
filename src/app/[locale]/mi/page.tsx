import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MiVista } from "./mi-vista";
import { getDict, hasLocale } from "@/i18n";
import { alternatesPara } from "@/i18n/meta";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/mi">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: getDict(locale).mi.titulo,
    robots: { index: false },
    alternates: alternatesPara(locale, "/mi"),
  };
}

export default async function MiPage({
  params,
}: PageProps<"/[locale]/mi">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <MiVista />;
}
