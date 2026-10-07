"use client";

import { useEffect, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { demoApi } from "@/lib/demo/api";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES } from "@/types";
import type { RoleAssignment, Rol, Usuario } from "@/types";

type AsignacionRol = { titular: string; apoyo: string };

/** El Grupo Base no rota: lo elige el General. Admin no rota: es permanente (se asigna a mano). */
const MATRIZ_ROLES = ROLES.filter((r) => r !== "grupo-base" && r !== "admin");

function emptyAssignments(): Record<Rol, AsignacionRol> {
  const out = {} as Record<Rol, AsignacionRol>;
  for (const rol of MATRIZ_ROLES) out[rol] = { titular: "", apoyo: "" };
  return out;
}

export function RotationPanel() {
  const { refreshRoles } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [mes, setMes] = useState("");
  const [asignaciones, setAsignaciones] =
    useState<Record<Rol, AsignacionRol>>(emptyAssignments);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  async function cargar() {
    try {
      const res = await api<{
        mes: string;
        usuarios: Usuario[];
        roles: RoleAssignment[];
      }>("admin.users");
      applyData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar.");
      setUsuarios([]);
    }
  }

  function applyData(res: {
    mes: string;
    usuarios: Usuario[];
    roles: RoleAssignment[];
  }) {
    setUsuarios(res.usuarios ?? []);
    setMes(res.mes);
    const next = emptyAssignments();
    for (const r of res.roles ?? []) {
      if (!(r.rol in next)) continue;
      next[r.rol][r.tipo] = r.uid;
    }
    setAsignaciones(next);
  }

  useEffect(() => {
    api<{ mes: string; usuarios: Usuario[]; roles: RoleAssignment[] }>(
      "admin.users",
    )
      .then(applyData)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setUsuarios([]);
      });
  }, []);

  function setRol(rol: Rol, tipo: "titular" | "apoyo", uid: string) {
    setAsignaciones((prev) => ({ ...prev, [rol]: { ...prev[rol], [tipo]: uid } }));
    setOk(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(null);

    const lista: RoleAssignment[] = [];
    for (const rol of MATRIZ_ROLES) {
      const { titular } = asignaciones[rol];
      if (titular) lista.push({ mes, rol, uid: titular, tipo: "titular" });
    }
    if (lista.length === 0) {
      setError("Asigna al menos un titular.");
      return;
    }

    setBusy(true);
    try {
      if (DEMO_MODE) {
        const res = await demoApi<{ mes: string; asignaciones: RoleAssignment[] }>(
          "admin.rotate",
          { mes, asignaciones: lista },
        );
        setOk(`Rotación guardada: ${res.asignaciones.length} asignaciones del mes.`);
      } else {
        const res = await api<{ mes: string; asignaciones: RoleAssignment[] }>(
          "admin.rotate",
          { mes, asignaciones: lista },
        );
        setOk(`Rotación guardada: ${res.asignaciones.length} asignaciones del mes.`);
      }
      await refreshRoles();
      await cargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  if (usuarios === null) {
    return <SkeletonFilas n={4} />;
  }

  const selectUser = (value: string, onChange: (uid: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="db-input"
    >
      <option value="">— Sin asignar —</option>
      {usuarios.map((u) => (
        <option key={u.uid} value={u.uid}>
          {u.nombre || u.email}
        </option>
      ))}
    </select>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="mes" className="db-kicker mb-1 block">
            Mes de rotación
          </label>
          <input
            id="mes"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="db-input w-auto!"
          />
        </div>
        <p className="db-muted pb-1.5 text-xs">
          Titular: permisos completos. Los apoyos los elige cada titular en su
          panel; el Grupo Base lo elige el General.
        </p>
      </div>

      <div className="space-y-3">
        {MATRIZ_ROLES.map((rol) => (
          <div
            key={rol}
            className="grid gap-2 rounded-xl border border-white/12 p-3 sm:grid-cols-[10rem_1fr_1fr]"
          >
            <span className="db-title self-center text-sm">{rol}</span>
            <div className="min-w-0">
              <span className="db-muted mb-1 block text-xs">titular</span>
              {selectUser(asignaciones[rol].titular, (uid) =>
                setRol(rol, "titular", uid),
              )}
            </div>
            <div className="min-w-0">
              <span className="db-muted mb-1 block text-xs">
                apoyo (en su panel)
              </span>
              <p className="db-muted py-2 text-xs">
                {asignaciones[rol].apoyo
                  ? usuarios.find((u) => u.uid === asignaciones[rol].apoyo)
                      ?.nombre ?? asignaciones[rol].apoyo
                  : "— Sin apoyos —"}
              </p>
            </div>
          </div>
        ))}
        <div className="grid gap-2 rounded-xl border border-dashed border-white/12 p-3 sm:grid-cols-[10rem_1fr]">
          <span className="db-title self-center text-sm">grupo-base</span>
          <p className="db-muted self-center text-xs">
            No rota: lo elige el General desde su panel.
          </p>
        </div>
        <div className="grid gap-2 rounded-xl border border-dashed border-white/12 p-3 sm:grid-cols-[10rem_1fr]">
          <span className="db-title self-center text-sm">admin</span>
          <p className="db-muted self-center text-xs">
            No rota: es permanente y se asigna a mano en la hoja Roles del
            spreadsheet (mes indiferente).
          </p>
        </div>
      </div>

      {error && <p className="db-error">{error}</p>}
      {ok && <p className="db-ok">{ok}</p>}

      <button type="submit" disabled={busy} className="db-btn w-full">
        {busy ? "Guardando rotación…" : "Guardar rotación del mes"}
      </button>
    </form>
  );
}
