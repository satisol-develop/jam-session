import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LoginForm } from "./login-form";
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
        <div className="p-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
          {getDict(locale).login.cargando}
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
