// Home route per role. Lives outside ProtectedRoute.tsx so the component file
// can export only the component (Fast Refresh friendly).
import type { Role } from '../types';

const HOME_BY_ROLE: Record<Role, string> = {
  STUDENT: '/student',
  LECTURER: '/lecturer',
  ADMIN: '/admin',
};

export const homeForRole = (role: Role): string => HOME_BY_ROLE[role];
