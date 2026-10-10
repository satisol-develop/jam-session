import { notFound } from "next/navigation";
import { ROLES } from "@/types";
import { RolPanelClient } from "./panel-client";

export function generateStaticParams() {
  return ROLES.map((rol) => ({ rol }));
}

export default async function RolPanelPage({
  params,
}: {
  params: Promise<{ rol: string }>;
}) {
  const { rol } = await params;
  if (!ROLES.includes(rol as (typeof ROLES)[number])) notFound();
  return <RolPanelClient rol={rol} />;
}
