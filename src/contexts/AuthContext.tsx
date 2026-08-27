// AuthContext - user + login/logout
import { createContext, useState, useEffect, type ReactNode } from "react";
import type { AuthUser, Role } from "../types";
import * as authService from "../services/authService";

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...r: Role[]) => boolean;
}

export const AuthCtx = createContext<AuthCtx | null>(null);
export const STORAGE_KEY = "lms_auth";

// eslint-disable-next-line react-refresh/only-export-components
export const readStoredUser = (): AuthUser | null => {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = readStoredUser();
    if (u) setUser(u);
    setLoading(false);
  }, []);

  const login = async (identifier: string, password: string) => {
    const u = await authService.login({ identifier, password });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };
  const hasRole = (...roles: Role[]) => !!user && roles.includes(user.role);

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, hasRole }}>
      {children}
    </AuthCtx.Provider>
  );
};
