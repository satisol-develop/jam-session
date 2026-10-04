import type { ReactNode } from "react";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <div className="db-zone">{children}</div>;
}
