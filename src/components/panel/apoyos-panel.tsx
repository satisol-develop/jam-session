"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { api } from "@/lib/api/client";
import type { RoleAssignment, Rol, Usuario } from "@/types";

export function ApoyosPanel({ rol }: { rol: Rol }) {
  const { roles } = useAuth();
  const editable = roles[rol] === "titular";
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [apoyos, setApoyos] = useState<string[]>([]);
  const [titular, setTitular] = useState("");
  const [sel, setSel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  function aplicar(res: {
    usuarios?: Usuario[];
    roles?: RoleAssignment[];
  }) {
    setUsuarios(res.usuarios ?? []);
    const delRol = (res.roles ?? []).filter((r) => r.rol === rol);
    setTitular(delRol.find((r) => r.tipo === "titular")?.uid ?? "");
    setApoyos(delRol.filter((r) => r.tipo === "apoyo").map((r) => r.uid));
  }

  function recargar() {
    return api<{ usuarios: Usuario[]; roles: RoleAssignment[] }>("admin.users")
      .then(aplicar)
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setUsuarios([]);
      });
  }

  useEffect(() => {
    api<{ usuarios: Usuario[]; roles: RoleAssignment[] }>("admin.users")
      .then((res) => {
        setUsuarios(res.usuarios ?? []);
        const delRol = (res.roles ?? []).filter((r) => r.rol === rol);
        setTitular(delRol.find((r) => r.tipo === "titular")?.uid ?? "");
        setApoyos(delRol.filter((r) => r.tipo === "apoyo").map((r) => r.uid));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setUsuarios([]);
      });
  }, [rol]);

  async function guardar(nuevos: string[]) {
    setBusy(true);
    setError(null);
    setOk(null);
    try {
      await api("apoyo.set", { rol, uids: nuevos });
      setOk("Apoyos guardados.");
      setSel("");
      await recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setBusy(false);
    }
  }

  if (usuarios === null) {
    return <p className="db-muted text-sm">Cargando apoyos…</p>;
  }

  const nombre = (uid: string) =>
    usuarios.find((u) => u.uid === uid)?.nombre ||
    usuarios.find((u) => u.uid === uid)?.email ||
    uid;

  const candidatos = usuarios.filter(
    (u) =>
      u.estado === "activo" && u.uid !== titular && !apoyos.includes(u.uid),
  );

  return (
    <div className="space-y-4">
      <ul className="space-y-1 text-sm">
        {apoyos.length === 0 && (
          <li className="db-muted">Sin apoyos todavía.</li>
        )}
        {apoyos.map((uid) => (
          <li key={uid} className="flex items-center justify-between gap-2">
            <span>
              {nombre(uid)}
              <span className="db-muted text-xs"> · apoyo (solo lectura)</span>
            </span>
            {editable && (
              <button
                onClick={() => guardar(apoyos.filter((a) => a !== uid))}
                disabled={busy}
                className="db-ghost text-xs!"
                aria-label={`Quitar apoyo de ${nombre(uid)}`}
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
            aria-label="Elegir apoyo"
          >
            <option value="">— Elegir apoyo —</option>
            {candidatos.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.nombre || u.email}
              </option>
            ))}
          </select>
          <button
            onClick={() => sel && guardar([...apoyos, sel])}
            disabled={busy || !sel}
            className="db-btn text-xs!"
          >
            Añadir
          </button>
        </div>
      ) : (
        <p className="db-muted text-xs">
          Los apoyos los gestiona el titular de {rol}.
        </p>
      )}

      <p className="db-muted text-xs">
        Añade a quien te ayude este mes (sin límite de número). Los apoyos
        entran a tu panel en modo solo lectura.
      </p>

      {ok && <p className="db-ok">{ok}</p>}
      {error && <p className="db-error">{error}</p>}
    </div>
  );
}
