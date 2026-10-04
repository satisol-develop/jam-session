"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import type { RoleAssignment, Usuario } from "@/types";

export function GrupoBasePanel() {
  const { roles } = useAuth();
  const editable = roles["general"] === "titular";
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [miembros, setMiembros] = useState<string[]>([]);
  const [sel, setSel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function recargar() {
    return api<{ usuarios: Usuario[]; roles: RoleAssignment[] }>("admin.users")
      .then((res) => {
        setUsuarios(res.usuarios ?? []);
        setMiembros(
          (res.roles ?? [])
            .filter((r) => r.rol === "grupo-base")
            .map((r) => r.uid),
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setUsuarios([]);
      });
  }

  useEffect(() => {
    api<{ usuarios: Usuario[]; roles: RoleAssignment[] }>("admin.users")
      .then((res) => {
        setUsuarios(res.usuarios ?? []);
        setMiembros(
          (res.roles ?? [])
            .filter((r) => r.rol === "grupo-base")
            .map((r) => r.uid),
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setUsuarios([]);
      });
  }, []);

  async function guardar(nuevos: string[]) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("gb.set", { uids: nuevos });
      setOk("Grupo Base actualizado.");
      setSel("");
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  if (usuarios === null) {
    return <p className="db-muted text-sm">Cargando Grupo Base…</p>;
  }

  const nombre = (uid: string) =>
    usuarios.find((u) => u.uid === uid)?.nombre ||
    usuarios.find((u) => u.uid === uid)?.email ||
    uid;

  const candidatos = usuarios.filter(
    (u) => u.estado === "activo" && !miembros.includes(u.uid),
  );

  return (
    <div className="space-y-4">
      <ul className="space-y-1 text-sm">
        {miembros.length === 0 && <li className="db-muted">Sin miembros.</li>}
        {miembros.map((uid) => (
          <li key={uid} className="flex items-center justify-between gap-2">
            <span>{nombre(uid)}</span>
            {editable && (
              <button
                onClick={() => guardar(miembros.filter((m) => m !== uid))}
                disabled={busy || miembros.length === 1}
                className="db-ghost text-xs!"
                aria-label={`Quitar a ${nombre(uid)} del Grupo Base`}
              >
                Quitar
              </button>
            )}
          </li>
        ))}
      </ul>

      {editable ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="db-input flex-1"
            aria-label="Elegir miembro del Grupo Base"
          >
            <option value="">— Añadir miembro —</option>
            {candidatos.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.nombre || u.email}
              </option>
            ))}
          </select>
          <button
            onClick={() => sel && guardar([...miembros, sel])}
            disabled={busy || !sel}
            className="db-btn text-xs!"
          >
            Añadir
          </button>
        </div>
      ) : (
        <p className="db-muted text-xs">
          El Grupo Base lo elige el titular del rol General.
        </p>
      )}

      <p className="db-muted text-xs">
        Tu grupo del mes: no rota en la matriz de administración. Quien esté en
        la lista tiene acceso al panel de Grupo Base (mínimo un miembro).
      </p>

      {ok && <p className="db-ok">{ok}</p>}
      {error && <p className="db-error">{error}</p>}
    </div>
  );
}
