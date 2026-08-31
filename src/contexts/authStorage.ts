// Auth storage helpers — separated from AuthContext so the context file
// only exports components (Fast Refresh friendly).
import type { AuthUser } from '../types';

export const STORAGE_KEY = 'lms_auth';
const SESSION_KEY = 'lms_session';

const safeUserFrom = (user: Partial<AuthUser> | null): Partial<AuthUser> | null => {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    avatarUrl: user.avatarUrl,
    type: user.type,
    isFirstLogin: user.isFirstLogin,
    firstLogin: user.firstLogin,
    permissions: user.permissions,
  };
};

const readSessionUser = (): AuthUser | null => {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null;
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

const writeSessionUser = (user: AuthUser | null): void => {
  try {
    if (!user) {
      sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // ignore session storage issues
  }
};

export const readStoredUser = (): AuthUser | null => {
  try {
    const rawProfile = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    const safeProfile = rawProfile ? (JSON.parse(rawProfile) as Partial<AuthUser>) : null;
    const sessionUser = readSessionUser();
    const base = safeUserFrom(safeProfile) ?? {};
    const merged = sessionUser ? { ...base, ...sessionUser } : { ...base };
    return Object.keys(merged).length > 0 ? (merged as AuthUser) : null;
  } catch {
    return readSessionUser();
  }
};

export const writeStoredUser = (user: AuthUser): void => {
  writeSessionUser(user);

  try {
    const safeUser = safeUserFrom(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safeUser));
  } catch {
    /* ignore quota / SSR */
  }
};

export const clearStoredUser = (): void => {
  writeSessionUser(null);
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export const updateStoredUser = (user: AuthUser): void => writeStoredUser(user);
