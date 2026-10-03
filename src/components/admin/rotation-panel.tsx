"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import { demoApi } from "@/lib/demo/api";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { useAuth } from "@/lib/auth/auth-provider";
import { ROLES } from "@/types";
import type { RoleAssignment, Rol, Usuario } from "@/types";

type AsignacionRol = { titular: string; apoyo: string };

function emptyAssignments(): Record<Rol, AsignacionRol> {
  const out = {} as Record<Rol, AsignacionRol>;
  for (const rol of ROLES) out[rol] = { titular: "", apoyo: "" };
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
    for (const rol of ROLES) {
      const { titular, apoyo } = asignaciones[rol];
      if (titular) lista.push({ mes, rol, uid: titular, tipo: "titular" });
      if (apoyo && apoyo !== titular) {
        lista.push({ mes, rol, uid: apoyo, tipo: "apoyo" });
      }
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
        const token = await getFirebaseAuth().currentUser?.getIdToken();
        const res = await fetch("/api/admin/rotate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ mes, asignaciones: lista }),
        });
        const json = (await res.json()) as { ok: boolean; error?: string; data?: { actualizados: number } };
        if (!json.ok) throw new Error(json.error ?? "No se pudo rotar.");
        setOk(`Rotación guardada: ${json.data?.actualizados ?? 0} usuarios actualizados.`);
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
    return <p className="text-sm text-neutral-500">Cargando matriz de usuarios…</p>;
  }

  const selectUser = (value: string, onChange: (uid: string) => void) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-neutral-300 bg-white px-2 py-1.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
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
      <div className="flex items-end gap-3">
        <div>
          <label htmlFor="mes" className="mb-1 block text-xs font-semibold uppercase text-neutral-500">
            Mes de rotación
          </label>
          <input
            id="mes"
            type="month"
            value={mes}
            onChange={(e) => setMes(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-black dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
        </div>
        <p className="pb-1.5 text-xs text-neutral-500">
          Titular: permisos completos. Apoyo: solo lectura del panel.
        </p>
      </div>

      <div className="space-y-3">
        {ROLES.map((rol) => (
          <div
            key={rol}
            className="grid gap-2 rounded-xl border border-neutral-200 p-3 dark:border-neutral-800 sm:grid-cols-[10rem_1fr_1fr]"
          >
            <span className="self-center text-sm font-semibold">{rol}</span>
            {(["titular", "apoyo"] as const).map((tipo) => (
              <div key={tipo}>
                <span className="mb-1 block text-xs text-neutral-500">{tipo}</span>
                {selectUser(asignaciones[rol][tipo], (uid) => setRol(rol, tipo, uid))}
              </div>
            ))}
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
          {ok}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {busy ? "Guardando rotación…" : "Guardar rotación del mes"}
      </button>
    </form>
  );
}
