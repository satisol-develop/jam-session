import { ROLES_META, ROLE_GUIDES } from "@/lib/constants";
import type { Rol } from "@/types";

export function RoleGuide({ rol }: { rol: Rol }) {
  const pasos = ROLE_GUIDES[rol];
  if (!pasos) return null;

  return (
    <section className="db-guide db-card p-5 sm:p-6">
      <h2 className="db-title mb-1 text-base">
        Guía de proceso · {ROLES_META[rol].label}
      </h2>
      <p className="db-muted mb-4 text-sm">
        Los pasos recomendados de tu rol, en orden. Ve marcando cada tarea en
        tu lista a medida que avances.
      </p>
      <ol>
        {pasos.map((paso) => (
          <li key={paso}>{paso}</li>
        ))}
      </ol>
    </section>
  );
}
