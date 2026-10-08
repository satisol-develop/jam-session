"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase/client";
import { api } from "@/lib/api/client";
import { DEMO_MODE } from "@/lib/demo";
import {
  clearDemoSession,
  demoAccountFor,
  demoRolesFor,
  demoStore,
  ensureDemoUsuario,
  readDemoSession,
  writeDemoSession,
  type DemoAccount,
} from "@/lib/demo/data";
import type { RolesMap } from "@/types";

interface AuthContextValue {
  user: User | null;
  roles: RolesMap;
  loading: boolean;
  /** La cuenta creada por el admin aún usa la contraseña con la que se creó. */
  clavePendiente: boolean;
  /** La primera verificación de sesión/roles falló: mensaje del error. */
  rolesError: string | null;
  /** Devuelve los roles del usuario tras entrar (para elegir destino). */
  signIn: (email: string, password: string) => Promise<RolesMap>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshRoles: () => Promise<RolesMap>;
  /** Reintenta la verificación de sesión/roles tras un fallo. */
  reintentar: () => Promise<void>;
  /** Recarga el usuario de Firebase (p. ej. tras verificar el correo). */
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function demoUser(account: DemoAccount): User {
  return {
    uid: account.uid,
    email: account.email,
    displayName: account.nombre,
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    metadata: {},
  } as unknown as User;
}

function demoSessionAccount(): DemoAccount | null {
  const session = readDemoSession();
  if (!session) return null;
  return demoAccountFor(session.email, session.nombre);
}

function setSessionCookies(user: User | null, roles: RolesMap) {
  if (typeof document === "undefined") return;
  if (user) {
    document.cookie = `jam_auth=1; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
    document.cookie = `jam_role=${encodeURIComponent(JSON.stringify(roles))}; path=/; max-age=${60 * 60 * 24 * 30}; samesite=lax`;
  } else {
    document.cookie = "jam_auth=; path=/; max-age=0";
    document.cookie = "jam_role=; path=/; max-age=0";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<RolesMap>({});
  const [loading, setLoading] = useState(true);
  const [clavePendiente, setClavePendiente] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);
  // Solo el primer fallo bloquea: fallos posteriores dejan el estado anterior.
  const verificadoRef = useRef(false);

  const loadRoles = useCallback(async (u: User): Promise<RolesMap> => {
    // Los roles y el estado de la contraseña viven en Apps Script (user.me).
    try {
      const me = await api<{
        roles?: RolesMap;
        usuario?: { clavePendiente?: boolean };
      }>("user.me");
      const map = me?.roles ?? {};
      setRoles(map);
      setClavePendiente(me?.usuario?.clavePendiente === true);
      setSessionCookies(u, map);
      verificadoRef.current = true;
      setRolesError(null);
      return map;
    } catch (err) {
      // Sin red o sesión rechazada: no se toca el flag de contraseña.
      setSessionCookies(u, {});
      if (!verificadoRef.current) {
        setRolesError(
          err instanceof Error && err.message
            ? err.message
            : "No se pudo verificar tu sesión.",
        );
      }
      return {};
    }
  }, []);

  useEffect(() => {
    if (DEMO_MODE) {
      queueMicrotask(() => {
        const account = demoSessionAccount();
        if (account) {
          const u = demoUser(account);
          const map = demoRolesFor(account);
          setUser(u);
          setRoles(map);
          setSessionCookies(u, map);
        }
        setLoading(false);
      });
      return;
    }

    const auth = getFirebaseAuth();
    // Red de seguridad: si onAuthStateChanged no llega (Firebase caído o
    // bloqueado), no dejamos la pantalla de carga eterna.
    const fallback = setTimeout(() => setLoading(false), 10000);
    const unsub = onAuthStateChanged(auth, async (u) => {
      clearTimeout(fallback);
      setUser(u);
      if (u) {
        await loadRoles(u).catch(() => setSessionCookies(u, {}));
      } else {
        setRoles({});
        setSessionCookies(null, {});
      }
      setLoading(false);
    });
    return () => {
      clearTimeout(fallback);
      unsub();
    };
  }, [loadRoles]);

  const signIn = useCallback(
    async (email: string, _password: string): Promise<RolesMap> => {
      if (DEMO_MODE) {
        const account = demoAccountFor(email);
        ensureDemoUsuario(demoStore(), account);
        const u = demoUser(account);
        const map = demoRolesFor(account);
        writeDemoSession(email, account.nombre);
        setUser(u);
        setRoles(map);
        setSessionCookies(u, map);
        return map;
      }
      await signInWithEmailAndPassword(getFirebaseAuth(), email, _password);
      // Carga aquí los roles para que el login pueda decidir a dónde ir
      // (panel si tiene roles, Mi zona si es músico sin roles).
      const u = getFirebaseAuth().currentUser;
      return u ? await loadRoles(u) : {};
    },
    [loadRoles],
  );

  const register = useCallback(
    async (nombre: string, email: string, password: string) => {
      if (DEMO_MODE) {
        const account = demoAccountFor(email, nombre);
        ensureDemoUsuario(demoStore(), account);
        const u = demoUser(account);
        const map = demoRolesFor(account);
        writeDemoSession(email, nombre);
        setUser(u);
        setRoles(map);
        setSessionCookies(u, map);
        return;
      }
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      await updateProfile(cred.user, { displayName: nombre });
      try {
        // El registro solo se completa tras verificar el correo.
        await sendEmailVerification(cred.user);
      } catch {
        // Si Firebase ya lo envió al crear la cuenta, se ignora.
      }
      await cred.user.getIdToken(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    if (DEMO_MODE) {
      clearDemoSession();
      setUser(null);
      setRoles({});
      setRolesError(null);
      setSessionCookies(null, {});
      return;
    }
    await signOut(getFirebaseAuth());
    setRolesError(null);
  }, []);

  const refreshRoles = useCallback(async () => {
    if (DEMO_MODE) {
      const account = demoSessionAccount();
      const map = account ? demoRolesFor(account) : {};
      setRoles(map);
      return map;
    }
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return {};
    return loadRoles(auth.currentUser);
  }, [loadRoles]);

  const reintentar = useCallback(async () => {
    if (DEMO_MODE) return;
    setRolesError(null);
    const auth = getFirebaseAuth();
    if (auth.currentUser) {
      await loadRoles(auth.currentUser);
    } else {
      // Sesión caducada en el cliente: se reevalúa desde cero.
      verificadoRef.current = false;
      setLoading(true);
      await auth.authStateReady().catch(() => undefined);
      setLoading(false);
    }
  }, [loadRoles]);

  const refreshUser = useCallback(async () => {
    if (DEMO_MODE) return;
    const auth = getFirebaseAuth();
    const u = auth.currentUser;
    if (!u) return;
    await u.reload();
    // loadRoles re-renderiza el contexto con refs nuevas (user.emailVerified
    // queda actualizado en la misma instancia recargada).
    await loadRoles(u);
  }, [loadRoles]);

  const value = useMemo(
    () => ({
      user,
      roles,
      loading,
      clavePendiente,
      rolesError,
      signIn,
      register,
      logout,
      refreshRoles,
      reintentar,
      refreshUser,
    }),
    [
      user,
      roles,
      loading,
      clavePendiente,
      rolesError,
      signIn,
      register,
      logout,
      refreshRoles,
      reintentar,
      refreshUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
