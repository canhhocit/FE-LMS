// Hook to consume AuthCtx. Kept in its own file so the Provider file
// can remain Fast-Refresh friendly (exports only the component).
import { useContext } from 'react';
import { AuthCtx, type AuthCtxValue } from './authContextValue';

export type { AuthCtxValue };

export function useAuth(): AuthCtxValue {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
