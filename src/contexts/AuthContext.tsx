// AuthProvider component — exports ONLY a React component so Fast Refresh works.
// The context object and the consumer hook live in their own files:
//   ./authContext.ts  (context + value type)
//   ./useAuth.ts      (consumer hook)
//   ./authStorage.ts  (localStorage helpers)
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import type { AuthUser, Role } from '../types';
import * as authService from '../services/authService';
import { readStoredUser, writeStoredUser, clearStoredUser } from './authStorage';
import { AuthCtx, type AuthCtxValue } from './authContextValue';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Lazy initialiser reads from localStorage synchronously once — no effect needed.
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser());
  // Loading stays false because we already hydrated above; reserved for future async profile fetch.
  const [loading] = useState(false);

  // Re-hydrate when storage changes in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key && e.key !== 'lms_auth') return;
      setUser(readStoredUser());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const u = await authService.login({ identifier, password });
    writeStoredUser(u);
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    clearStoredUser();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => !!user && roles.includes(user.role),
    [user],
  );

  const hasPermission = useCallback(
    (permission: string) => !!user && (user.permissions ?? []).includes(permission),
    [user],
  );

  const value: AuthCtxValue = { user, loading, login, logout, hasRole, hasPermission };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};
