// Layout chung: sidebar + topbar + content. Items lọc theo role.
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../contexts/useAuth';
import type { Role } from '../types';

interface NavItem { to: string; label: string; icon: string; }

const NAV: Record<Role, NavItem[]> = {
  STUDENT: [
    { to: '/student', label: 'Tổng quan', icon: '🏠' },
    { to: '/student/classes', label: 'Lớp học', icon: '📚' },
    { to: '/student/notifications', label: 'Thông báo', icon: '🔔' },
    { to: '/student/tuition', label: 'Học phí', icon: '💳' },
    { to: '/student/quizzes', label: 'Quiz', icon: '🧠' },
    { to: '/student/assignments', label: 'Bài tập', icon: '📝' },
    { to: '/student/grades', label: 'Điểm', icon: '📊' },
    { to: '/student/attendance', label: 'Điểm danh', icon: '✅' },
    { to: '/student/schedule', label: 'Thời khoá biểu', icon: '📅' },
    { to: '/student/transcript', label: 'Bảng điểm', icon: '📜' },
    { to: '/student/profile', label: 'Hồ sơ', icon: '👤' },
    { to: '/student/chat', label: 'Tin nhắn', icon: '💬' },
  ],
  LECTURER: [
    { to: '/lecturer', label: 'Tổng quan', icon: '🏠' },
    { to: '/lecturer/classes', label: 'Lớp học', icon: '📚' },
    { to: '/lecturer/notifications', label: 'Thông báo', icon: '🔔' },
    { to: '/lecturer/quizzes', label: 'Quiz', icon: '🧠' },
    { to: '/lecturer/assignments', label: 'Bài tập', icon: '📝' },
    { to: '/lecturer/grading', label: 'Chấm điểm/Điểm danh', icon: '✅' },
    { to: '/lecturer/schedule', label: 'Lịch dạy', icon: '📅' },
    { to: '/lecturer/profile', label: 'Hồ sơ', icon: '👤' },
    { to: '/lecturer/chat', label: 'Tin nhắn', icon: '💬' },
  ],
  ADMIN: [
    { to: '/admin', label: 'Dashboard', icon: '🏠' },
    { to: '/admin/users', label: 'Người dùng', icon: '👥' },
    { to: '/admin/classes', label: 'Lớp học', icon: '📚' },
    { to: '/admin/curricula', label: 'Chương trình ĐT', icon: '🎓' },
    { to: '/admin/registration', label: 'Đợt đăng ký', icon: '📝' },
    { to: '/admin/reports', label: 'Báo cáo', icon: '📈' },
  ],
};

const ROLE_LABEL: Record<Role, string> = { STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị' };

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  const role = user.role;
  const items: NavItem[] = NAV[role];
  const roleLower = role.toLowerCase();

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/60 p-4 flex flex-col">
        <Link to={`/${roleLower}`} className="flex items-center gap-2 px-2 py-3">
          <span className="text-2xl">🎓</span>
          <div>
            <div className="font-bold">LearningHub</div>
            <div className="text-xs text-slate-400">{ROLE_LABEL[role]}</div>
          </div>
        </Link>
        <nav className="mt-4 flex-1 space-y-1">
          {items.map((it: NavItem) => (
            <NavLink key={it.to} to={it.to} end={it.to === `/${roleLower}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40' : 'hover:bg-slate-800 text-slate-300'
                }`}>
              <span>{it.icon}</span><span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <button onClick={() => { logout(); nav('/login'); }}
          className="mt-2 text-xs text-slate-400 hover:text-rose-300 px-3 py-2 text-left">
          ⏻ Đăng xuất
        </button>
      </aside>
      <main className="flex-1 overflow-auto">
        <header className="border-b border-slate-800 bg-slate-900/40 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-slate-400">Xin chào, <span className="text-slate-200 font-medium">{user.fullName}</span></div>
          <div className="text-xs text-slate-500">v0.1 · backend</div>
        </header>
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
}

export const PageTitle = ({ children }: { children: ReactNode }) =>
  <h1 className="text-2xl font-bold mb-4">{children}</h1>;

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <div className={`rounded-xl border border-slate-800 bg-slate-900/60 p-4 ${className}`}>{children}</div>;

export const Spinner = () =>
  <div className="flex items-center justify-center p-8 text-slate-400">
    <span className="animate-pulse">⏳ Đang tải…</span>
  </div>;

export const Empty = ({ msg = 'Chưa có dữ liệu' }: { msg?: string }) =>
  <div className="text-center text-slate-500 py-8 italic">{msg}</div>;

export const ErrorBox = ({ msg }: { msg: string }) =>
  <div className="border border-rose-700/50 bg-rose-900/20 text-rose-200 rounded-lg p-3 text-sm">{msg}</div>;

const PILL_C: Record<string, string> = {
  slate: 'bg-slate-700/40 text-slate-200',
  green: 'bg-emerald-700/40 text-emerald-200',
  amber: 'bg-amber-700/40 text-amber-200',
  red: 'bg-rose-700/40 text-rose-200',
  indigo: 'bg-indigo-700/40 text-indigo-200',
};
export const Pill = ({ children, color = 'slate' }: { children: ReactNode; color?: 'slate' | 'green' | 'amber' | 'red' | 'indigo' }) =>
  <span className={`px-2 py-0.5 rounded text-xs ${PILL_C[color]}`}>{children}</span>;