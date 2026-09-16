// Auth storage helpers — separated from AuthContext so the context file
// only exports components (Fast Refresh friendly).
import type { AuthUser } from '../types';

export const STORAGE_KEY = 'lms_auth';
const SESSION_KEY = 'lms_session';

const readSessionUser = (): AuthUser | null => {
  try {
    const raw = typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_KEY) : null;
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    return parsed && parsed.token ? parsed : null;
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
    const safeProfile = rawProfile ? (JSON.parse(rawProfile) as AuthUser) : null;
    const sessionUser = readSessionUser();
    const candidate = sessionUser ?? safeProfile;

    if (!candidate || !candidate.token) {
      if (typeof window !== 'undefined' && (rawProfile || sessionStorage.getItem(SESSION_KEY))) {
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.removeItem(SESSION_KEY);
      }
      return null;
    }
    return candidate;
  } catch {
    return null;
  }
};

export const writeStoredUser = (user: AuthUser): void => {
  writeSessionUser(user);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
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

