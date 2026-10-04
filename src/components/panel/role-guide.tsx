"use client";

import { ROLES_META, ROLE_GUIDES } from "@/lib/constants";
import type { Rol } from "@/types";

export function RoleGuide({ rol }: { rol: Rol }) {
  const pasos = ROLE_GUIDES[rol];
  if (!pasos) return null;

  return (
    <details className="db-guide">
      <summary>Guía de proceso · {ROLES_META[rol].label}</summary>
      <ol>
        {pasos.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
    </details>
  );
}
