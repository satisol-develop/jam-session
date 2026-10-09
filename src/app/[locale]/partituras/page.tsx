import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartiturasVista } from "./partituras-vista";
import { getDict, hasLocale } from "@/i18n";
import { alternatesPara } from "@/i18n/meta";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/partituras">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: getDict(locale).partituras.title,
    alternates: alternatesPara(locale, "/partituras"),
  };
}

export default async function PartiturasPage({
  params,
}: PageProps<"/[locale]/partituras">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <PartiturasVista />;
}
