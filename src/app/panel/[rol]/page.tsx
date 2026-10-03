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
  return <RolPanelClient rol={rol} />;
}
