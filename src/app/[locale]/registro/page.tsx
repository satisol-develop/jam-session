import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RegistroForm } from "./registro-form";
import { getDict, hasLocale } from "@/i18n";
import { alternatesPara } from "@/i18n/meta";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/registro">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: getDict(locale).registro.title,
    alternates: alternatesPara(locale, "/registro"),
  };
}

export default async function RegistroPage({
  params,
}: PageProps<"/[locale]/registro">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return <RegistroForm />;
}
