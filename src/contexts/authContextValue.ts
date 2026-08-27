// React context object. Defined in its own file (no JSX, no components)
// so the AuthContext.tsx file can export only the AuthProvider component
// and stay Fast-Refresh friendly.
import { createContext } from 'react';
import type { AuthUser, Role } from '../types';

export interface AuthCtxValue {
  user: AuthUser | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: Role[]) => boolean;
}

export const AuthCtx = createContext<AuthCtxValue | null>(null);
