import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginForm } from "./login-form";
import { PantallaCargando } from "@/components/loading";
import { getDict, hasLocale } from "@/i18n";
import { alternatesPara } from "@/i18n/meta";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(locale)) return {};
  return {
    title: getDict(locale).login.title,
    alternates: alternatesPara(locale, "/login"),
  };
}

export default async function LoginPage({
  params,
}: PageProps<"/[locale]/login">) {
  const { locale } = await params;
  if (!hasLocale(locale)) notFound();
  return (
    <Suspense
      fallback={
        <PantallaCargando texto={getDict(locale).login.cargando} />
      }
    >
      <LoginForm />
    </Suspense>
  );
}
