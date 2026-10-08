"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { SkeletonFilas } from "@/components/loading";
import { api } from "@/lib/api/client";
import { ROLES_META } from "@/lib/constants";
import { ROLES, type RoleAssignment, type Rol, type TipoRol } from "@/types";

interface UsuarioAdmin {
  uid: string;
  email: string;
  nombre: string;
  telefono: string;
  estado: string;
  fechaAlta: string;
}

/**
 * Gestión de cuentas (solo admin): crea usuarios, edita nombre/teléfono,
 * restablece contraseñas, da de baja y asigna roles del mes con un toque.
 */
export function UsuariosPanel() {
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[] | null>(null);
  const [roles, setRoles] = useState<RoleAssignment[]>([]);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creado, setCreado] = useState<string | null>(null);

  const [expandido, setExpandido] = useState<string | null>(null);
  const [draft, setDraft] = useState({ nombre: "", telefono: "" });
  const [accionUid, setAccionUid] = useState<string | null>(null);
  const [confirmarBaja, setConfirmarBaja] = useState<string | null>(null);
  const [nota, setNota] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const recargar = useCallback(() => {
    api<{ mes: string; usuarios: UsuarioAdmin[]; roles: RoleAssignment[] }>(
      "admin.users",
    )
      .then((d) => {
        setUsuarios(d.usuarios ?? []);
        setRoles(d.roles ?? []);
      })
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
        `Cuenta creada para ${res.email}. Contraseña por defecto: ${res.clave} — compártela y el usuario la cambiará al entrar.`,
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

  function abrir(u: UsuarioAdmin) {
    setNota(null);
    setErrorAccion(null);
    setConfirmarBaja(null);
    if (expandido === u.uid) {
      setExpandido(null);
      return;
    }
    setExpandido(u.uid);
    setDraft({ nombre: u.nombre, telefono: u.telefono });
  }

  async function guardar(uid: string) {
    setAccionUid(uid);
    setNota(null);
    setErrorAccion(null);
    try {
      const res = await api<{
        uid: string;
        nombre: string;
        telefono: string;
        estado: string;
      }>("admin.updateUser", {
        uid,
        nombre: draft.nombre,
        telefono: draft.telefono,
      });
      setUsuarios((prev) =>
        prev
          ? prev.map((u) =>
              u.uid === uid
                ? { ...u, nombre: res.nombre, telefono: res.telefono }
                : u,
            )
          : prev,
      );
      setNota("Datos guardados.");
    } catch (err) {
      setErrorAccion(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setAccionUid(null);
    }
  }

  async function cambiarEstado(u: UsuarioAdmin) {
    const nuevo = u.estado === "baja" ? "activo" : "baja";
    setAccionUid(u.uid);
    setConfirmarBaja(null);
    setNota(null);
    setErrorAccion(null);
    try {
      await api("admin.updateUser", { uid: u.uid, estado: nuevo });
      setUsuarios((prev) =>
        prev ? prev.map((x) => (x.uid === u.uid ? { ...x, estado: nuevo } : x)) : prev,
      );
      setNota(
        nuevo === "baja"
          ? `${u.nombre || u.email} ha sido dado de baja: ya no puede entrar.`
          : `${u.nombre || u.email} vuelve a estar activo.`,
      );
    } catch (err) {
      setErrorAccion(
        err instanceof Error ? err.message : "No se pudo cambiar el estado.",
      );
    } finally {
      setAccionUid(null);
    }
  }

  async function restablecer(u: UsuarioAdmin) {
    setAccionUid(u.uid);
    setNota(null);
    setErrorAccion(null);
    try {
      await api("admin.resetPassword", { uid: u.uid });
      setNota(`Correo de restablecer contraseña enviado a ${u.email}.`);
    } catch (err) {
      setErrorAccion(
        err instanceof Error ? err.message : "No se pudo enviar el correo.",
      );
    } finally {
      setAccionUid(null);
    }
  }

  function tipoDe(uid: string, rol: Rol): TipoRol | undefined {
    const fila = roles.find((r) => r.uid === uid && r.rol === rol);
    return fila ? (fila.tipo as TipoRol) : undefined;
  }

  async function ciclarRol(uid: string, rol: Rol) {
    const actual = tipoDe(uid, rol);
    let siguiente: TipoRol | "" = "";
    if (rol === "admin" || rol === "grupo-base") {
      siguiente = actual ? "" : "titular";
    } else if (!actual) {
      siguiente = "titular";
    } else if (actual === "titular") {
      siguiente = "apoyo";
    } else {
      siguiente = "";
    }

    setAccionUid(uid);
    setNota(null);
    setErrorAccion(null);
    try {
      const res = await api<{ uid: string; rol: Rol; tipo: string }>(
        "admin.setUserRole",
        { uid, rol, tipo: siguiente },
      );
      setRoles((prev) => {
        const sinEste = prev.filter((r) => !(r.uid === uid && r.rol === rol));
        return res.tipo
          ? [
              ...sinEste,
              { mes: "", rol, uid, tipo: res.tipo as TipoRol },
            ]
          : sinEste;
      });
      setNota(
        res.tipo
          ? `${ROLES_META[rol].label}: ${res.tipo}`
          : `${ROLES_META[rol].label} quitado.`,
      );
    } catch (err) {
      setErrorAccion(
        err instanceof Error ? err.message : "No se pudo asignar el rol.",
      );
    } finally {
      setAccionUid(null);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onCreate} className="db-card space-y-3 p-4 sm:p-5">
        <p className="db-kicker">Crear usuario</p>
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
              placeholder="Nombre del usuario"
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

        {error && (
          <p className="db-error" role="alert">
            {error}
          </p>
        )}
        {creado && (
          <p className="db-ok" role="status">
            {creado}
          </p>
        )}

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
            {usuarios.map((u) => {
              const abierto = expandido === u.uid;
              const ocupado = accionUid === u.uid;
              return (
                <li
                  key={u.uid}
                  className="rounded-xl border border-white/12 bg-black/20"
                >
                  <button
                    type="button"
                    onClick={() => abrir(u)}
                    aria-expanded={abierto}
                    className="flex w-full flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-left text-sm"
                  >
                    <span className="min-w-0">
                      <span className="font-semibold">{u.nombre || "—"}</span>
                      <span className="db-muted ml-2 break-all text-xs">
                        {u.email}
                      </span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      {ROLES.filter((r) => tipoDe(u.uid, r)).map((r) => (
                        <span
                          key={r}
                          className="db-badge db-badge-line !text-[11px]"
                        >
                          {ROLES_META[r].label.split("·")[0].trim()}
                          {tipoDe(u.uid, r) === "apoyo" ? " · apoyo" : ""}
                        </span>
                      ))}
                      <span
                        className={`db-badge ${
                          u.estado === "baja"
                            ? "db-badge-line border-red-400/50! text-red-300!"
                            : "db-badge-solid"
                        }`}
                      >
                        {u.estado || "activo"}
                      </span>
                      <span aria-hidden className="db-muted text-xs">
                        {abierto ? "▾" : "▸"}
                      </span>
                    </span>
                  </button>

                  {abierto && (
                    <div className="space-y-4 border-t border-white/10 px-3 py-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`ed-nombre-${u.uid}`}
                            className="mb-1 block text-xs font-semibold"
                          >
                            Nombre
                          </label>
                          <input
                            id={`ed-nombre-${u.uid}`}
                            type="text"
                            value={draft.nombre}
                            disabled={ocupado}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, nombre: e.target.value }))
                            }
                            className="db-input"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`ed-tel-${u.uid}`}
                            className="mb-1 block text-xs font-semibold"
                          >
                            Teléfono
                          </label>
                          <input
                            id={`ed-tel-${u.uid}`}
                            type="tel"
                            value={draft.telefono}
                            disabled={ocupado}
                            onChange={(e) =>
                              setDraft((d) => ({ ...d, telefono: e.target.value }))
                            }
                            className="db-input"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => guardar(u.uid)}
                          className="db-btn"
                        >
                          {ocupado ? "Guardando…" : "Guardar datos"}
                        </button>
                        <button
                          type="button"
                          disabled={ocupado}
                          onClick={() => restablecer(u)}
                          className="db-ghost"
                        >
                          Restablecer contraseña
                        </button>
                        {u.estado === "baja" ? (
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => cambiarEstado(u)}
                            className="db-ghost"
                          >
                            Reactivar
                          </button>
                        ) : confirmarBaja === u.uid ? (
                          <span className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={ocupado}
                              onClick={() => cambiarEstado(u)}
                              className="db-ghost border-red-400/60! text-red-300!"
                            >
                              Sí, dar de baja
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmarBaja(null)}
                              className="db-ghost"
                            >
                              Cancelar
                            </button>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={ocupado}
                            onClick={() => setConfirmarBaja(u.uid)}
                            className="db-ghost border-red-400/40! text-red-300!"
                          >
                            Dar de baja
                          </button>
                        )}
                      </div>

                      <div>
                        <p className="db-kicker mb-2">
                          Roles del mes (toque para cambiar)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {ROLES.map((r) => {
                            const tipo = tipoDe(u.uid, r);
                            return (
                              <button
                                key={r}
                                type="button"
                                disabled={ocupado}
                                onClick={() => ciclarRol(u.uid, r)}
                                title={`${ROLES_META[r].label}: ${tipo ?? "sin rol"} (toque para cambiar)`}
                                className={`min-h-10 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                                  tipo === "titular"
                                    ? "bg-[#FFE600] text-black"
                                    : tipo === "apoyo"
                                      ? "bg-white/15 text-white"
                                      : "border border-white/15 text-white/60 hover:border-white/40 hover:text-white"
                                }`}
                              >
                                {ROLES_META[r].label.split("·")[0].trim()}
                                {tipo ? ` · ${tipo}` : ""}
                              </button>
                            );
                          })}
                        </div>
                        <p className="db-muted mt-1.5 text-[11px]">
                          Ciclo: sin rol → titular → apoyo → sin rol. Admin: solo
                          titular y permanente. Grupo Base: solo titulares (los
                          miembros los elige el General, sin apoyo).
                        </p>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {nota && (
          <p className="db-ok mt-3 text-sm" role="status">
            {nota}
          </p>
        )}
        {errorAccion && (
          <p className="db-error mt-3 text-sm" role="alert">
            {errorAccion}
          </p>
        )}
      </div>
    </div>
  );
}
