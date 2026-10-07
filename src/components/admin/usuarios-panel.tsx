"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";

interface UsuarioAdmin {
  uid: string;
  email: string;
  nombre: string;
  telefono: string;
  estado: string;
  fechaAlta: string;
}

/**
 * Gestión de cuentas (solo admin): crea participantes en Firebase con la
 * contraseña por defecto y muestra el listado de usuarios.
 */
export function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<string | null>(null);

  const recargar = useCallback(() => {
    api<{ usuarios: UsuarioAdmin[] }>("admin.users")
      .then((d) => setUsuarios(d.usuarios ?? []))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "No se pudo cargar.");
        setUsuarios([]);
      });
  }, []);

  useEffect(() => {
    recargar();
  }, [recargar]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCreado(null);
    setBusy(true);
    try {
      const res = await api<{ uid: string; email: string; clave: string }>(
        "admin.createUser",
        { nombre: nombre.trim(), email: email.trim() },
      );
      setCreado(
        `Cuenta creada para ${res.email}. Contraseña por defecto: ${res.clave} — compártela y el participante la cambiará al entrar.`,
      );
      setNombre("");
      setEmail("");
      recargar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear la cuenta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onCreate} className="db-card space-y-3">
        <p className="db-kicker">Crear participante</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="u-nombre" className="mb-1 block text-xs font-semibold">
              Nombre
            </label>
            <input
              id="u-nombre"
              type="text"
              required
              autoComplete="off"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del participante"
              className="db-input"
            />
          </div>
          <div>
            <label htmlFor="u-email" className="mb-1 block text-xs font-semibold">
              Correo
            </label>
            <input
              id="u-email"
              type="email"
              required
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="db-input"
            />
          </div>
        </div>

        {error && <p className="db-error">{error}</p>}
        {creado && <p className="db-ok">{creado}</p>}

        <button type="submit" disabled={busy} className="db-btn">
          {busy ? "Creando…" : "Crear cuenta"}
        </button>
        <p className="db-muted text-xs">
          Se da de alta con la contraseña por defecto del script (propiedad
          CLAVE_DEFECTO) y se le envía un correo de verificación; al entrar,
          la plataforma le pedirá cambiar la contraseña.
        </p>
      </form>

      <div>
        <p className="db-kicker mb-2">
          Usuarios ({usuarios === null ? "…" : usuarios.length})
        </p>
        {usuarios === null ? (
          <SkeletonFilas n={4} />
        ) : usuarios.length === 0 ? (
          <p className="db-muted text-sm">Todavía no hay usuarios dados de alta.</p>
        ) : (
          <ul className="space-y-2">
            {usuarios.map((u) => (
              <li
                key={u.uid}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/12 px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-semibold">{u.nombre || "—"}</span>
                  <span className="db-muted ml-2 text-xs">{u.email}</span>
                </span>
                <span className="db-badge db-badge-line">{u.estado}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
