// Auth storage helpers — separated from AuthContext so the context file
// only exports components (Fast Refresh friendly).
import type { AuthUser } from '../types';

export const STORAGE_KEY = 'lms_auth';

export const readStoredUser = (): AuthUser | null => {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
};

export const writeStoredUser = (user: AuthUser): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch {
    /* ignore quota / SSR */
  }
};

export const clearStoredUser = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

export const updateStoredUser = (user: AuthUser): void => writeStoredUser(user);
