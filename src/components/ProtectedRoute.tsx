// ProtectedRoute — chặn trang theo role
import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Role } from '../types';

export default function ProtectedRoute({ allow, children }: { allow?: Role[]; children: ReactNode }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="p-8 text-slate-400">Đang tải…</div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  if (allow && !allow.includes(user.role)) return <Navigate to={`/${user.role.toLowerCase()}`} replace />;
  return <>{children}</>;
}