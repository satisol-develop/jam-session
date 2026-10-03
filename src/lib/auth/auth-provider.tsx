"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { getFirebaseAuth, getGoogleProvider } from "@/lib/firebase/client";
import { DEMO_MODE } from "@/lib/demo";
import { DEMO_ROLES, DEMO_UID } from "@/lib/demo/data";
import type { RolesMap } from "@/types";

interface AuthContextValue {
  user: User | null;
  roles: RolesMap;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshRoles: () => Promise<RolesMap>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_SESSION_KEY = "jam_demo_email";

function demoUser(email: string, nombre?: string): User {
  return {
    uid: DEMO_UID,
    email,
    displayName: nombre ?? email.split("@")[0],
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    metadata: {},
  } as unknown as User;
}

function readDemoSession(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(DEMO_SESSION_KEY);
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

  const loadRoles = useCallback(async (u: User): Promise<RolesMap> => {
    const token = await u.getIdTokenResult(true);
    const claim = token.claims.jam_roles;
    const map =
      typeof claim === "object" && claim !== null ? (claim as RolesMap) : {};
    setRoles(map);
    setSessionCookies(u, map);
    return map;
  }, []);

  useEffect(() => {
    if (DEMO_MODE) {
      queueMicrotask(() => {
        const email = readDemoSession();
        if (email) {
          const u = demoUser(email);
          setUser(u);
          setRoles(DEMO_ROLES);
          setSessionCookies(u, DEMO_ROLES);
        }
        setLoading(false);
      });
      return;
    }

    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        await loadRoles(u).catch(() => setSessionCookies(u, {}));
      } else {
        setRoles({});
        setSessionCookies(null, {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [loadRoles]);

  const signIn = useCallback(async (email: string, _password: string) => {
    if (DEMO_MODE) {
      const u = demoUser(email);
      window.localStorage.setItem(DEMO_SESSION_KEY, email);
      setUser(u);
      setRoles(DEMO_ROLES);
      setSessionCookies(u, DEMO_ROLES);
      return;
    }
    await signInWithEmailAndPassword(getFirebaseAuth(), email, _password);
  }, []);

  const signInWithGoogle = useCallback(async () => {
    if (DEMO_MODE) {
      await signIn("demo@jam.session", "demo");
      return;
    }
    await signInWithPopup(getFirebaseAuth(), getGoogleProvider());
  }, [signIn]);

  const register = useCallback(
    async (nombre: string, email: string, password: string) => {
      if (DEMO_MODE) {
        const u = demoUser(email, nombre);
        window.localStorage.setItem(DEMO_SESSION_KEY, email);
        setUser(u);
        setRoles(DEMO_ROLES);
        setSessionCookies(u, DEMO_ROLES);
        return;
      }
      const cred = await createUserWithEmailAndPassword(
        getFirebaseAuth(),
        email,
        password,
      );
      await updateProfile(cred.user, { displayName: nombre });
      await cred.user.getIdToken(true);
    },
    [],
  );

  const logout = useCallback(async () => {
    if (DEMO_MODE) {
      window.localStorage.removeItem(DEMO_SESSION_KEY);
      setUser(null);
      setRoles({});
      setSessionCookies(null, {});
      return;
    }
    await signOut(getFirebaseAuth());
  }, []);

  const refreshRoles = useCallback(async () => {
    if (DEMO_MODE) {
      setRoles(DEMO_ROLES);
      return DEMO_ROLES;
    }
    const auth = getFirebaseAuth();
    if (!auth.currentUser) return {};
    return loadRoles(auth.currentUser);
  }, [loadRoles]);

  const value = useMemo(
    () => ({
      user,
      roles,
      loading,
      signIn,
      signInWithGoogle,
      register,
      logout,
      refreshRoles,
    }),
    [user, roles, loading, signIn, signInWithGoogle, register, logout, refreshRoles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>.");
  return ctx;
}
