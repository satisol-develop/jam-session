"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { useRequireAuth } from "@/lib/auth/use-require-auth";
import { EscaletaView } from "@/components/escaleta/escaleta-view";

export default function EscaletaPage() {
  const router = useRouter();
  const { roles, loading: cargandoAuth } = useAuth();
  const { pendiente } = useRequireAuth();
  const puedeEditar =
    roles["stage-manager"] === "titular" || roles["grupo-base"] === "titular";
  const puedeVer = Boolean(
    roles["stage-manager"] || roles["grupo-base"] || roles["general"] || roles["admin"],
  );

  if (cargandoAuth || pendiente) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="db-muted text-sm">Cargando…</p>
      </div>
    );
  }

  if (!puedeVer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="db-muted text-sm">
          Este panel es para Stage Manager y Grupo Base (y el General y el
          administrador en modo lectura).
        </p>
        <Link href="/panel" className="mt-2 text-sm text-[#FFE600] underline">
          Volver a paneles
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-6">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) window.history.back();
            else router.push("/panel");
          }}
          className="db-kicker inline-flex min-h-10 items-center underline"
        >
          ← Volver
        </button>
        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="db-title text-3xl sm:text-4xl">Escaleta en directo</h1>
        </div>
        <p className="db-muted mt-1 text-sm">
          Orden de actuación de la Jam. Los cambios se sincronizan entre todos
          los dispositivos.
        </p>
      </header>

      <EscaletaView puedeEditar={puedeEditar} />
    </div>
  );
}
