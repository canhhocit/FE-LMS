// ProtectedRoute — chặn trang theo role
// Exports only the React component so Fast Refresh works.
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import type { Role } from '../types';

export default function ProtectedRoute({
  allow,
  requiredPermission,
  children,
}: {
  allow?: Role[];
  requiredPermission?: string | string[];
  children: ReactNode;
}) {
  const { user, loading, hasPermission } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8 text-slate-400">Đang tải…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to="/403" replace />;
  const permissions = Array.isArray(requiredPermission) ? requiredPermission : requiredPermission ? [requiredPermission] : [];
  if (permissions.length > 0 && !permissions.some(hasPermission)) return <Navigate to="/403" replace />;
  return <>{children}</>;
}