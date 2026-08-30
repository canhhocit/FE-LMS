// Layout chung: sidebar + topbar + content. Items lọc theo role.
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import * as notificationService from '../services/notificationService';
import type { Role } from '../types';
import { Card as UiCard, ErrorState, EmptyState, LoadingState, PageHeader, StatusBadge } from './ui';

interface NavItem { to: string; label: string; icon: string; }
interface NavSection { title: string; items: NavItem[] }

const NAV: Record<Role, NavSection[]> = {
  STUDENT: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/student', label: 'Trang chủ', icon: '🏠' },
        { to: '/student/classes', label: 'Lớp học', icon: '📚' },
        { to: '/student/notifications', label: 'Thông báo', icon: '🔔' },
      ],
    },
    {
      title: 'Học tập',
      items: [
        { to: '/student/assignments', label: 'Bài tập', icon: '📝' },
        { to: '/student/quizzes', label: 'Quiz', icon: '🧠' },
        { to: '/student/grades', label: 'Điểm', icon: '📊' },
        { to: '/student/schedule', label: 'Lịch học', icon: '📅' },
      ],
    },
    {
      title: 'Cá nhân',
      items: [
        { to: '/student/profile', label: 'Hồ sơ', icon: '👤' },
        { to: '/student/registrations', label: 'Đăng ký', icon: '📋' },
        { to: '/student/tuition', label: 'Học phí', icon: '💳' },
      ],
    },
  ],
  LECTURER: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/lecturer', label: 'Trang chủ', icon: '🏠' },
        { to: '/lecturer/classes', label: 'Lớp học', icon: '📚' },
        { to: '/lecturer/notifications', label: 'Thông báo', icon: '🔔' },
      ],
    },
    {
      title: 'Quản lý',
      items: [
        { to: '/lecturer/assignments', label: 'Bài tập', icon: '📝' },
        { to: '/lecturer/quizzes', label: 'Quiz', icon: '🧠' },
        { to: '/lecturer/grading', label: 'Chấm điểm', icon: '✅' },
        { to: '/lecturer/schedule', label: 'Lịch dạy', icon: '📅' },
      ],
    },
    {
      title: 'Cá nhân',
      items: [{ to: '/lecturer/profile', label: 'Hồ sơ', icon: '👤' }],
    },
  ],
  ADMIN: [
    {
      title: 'Quản trị',
      items: [
        { to: '/admin', label: 'Dashboard', icon: '🏠' },
        { to: '/admin/users', label: 'Người dùng', icon: '👥' },
        { to: '/admin/classes', label: 'Lớp học', icon: '📚' },
        { to: '/admin/curricula', label: 'Chương trình ĐT', icon: '🎓' },
        { to: '/admin/registration', label: 'Đợt đăng ký', icon: '📝' },
        { to: '/admin/reports', label: 'Báo cáo', icon: '📈' },
      ],
    },
  ],
};

const ROLE_LABEL: Record<Role, string> = { STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị' };

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const loadUnreadCount = async () => {
      try {
        const count = await notificationService.getUnreadCount();
        if (mounted) setUnreadCount(Number(count ?? 0));
      } catch {
        // Silent fail
      }
    };

    const handleNotificationsUpdated = () => {
      void loadUnreadCount();
    };

    void loadUnreadCount();
    window.addEventListener('notifications:updated', handleNotificationsUpdated);
    const interval = setInterval(loadUnreadCount, 30000); // Refresh every 30 seconds
    return () => {
      mounted = false;
      window.removeEventListener('notifications:updated', handleNotificationsUpdated);
      clearInterval(interval);
    };
  }, []);

  if (!user) return null;
  const role = user.role;
  const sections = NAV[role];
  const roleLower = role.toLowerCase();

  return (
    <div className="min-h-screen flex bg-[#243b78] text-slate-900">
      {sidebarOpen && <button aria-label="Đóng menu" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-30 bg-slate-950/25 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-white/10 bg-[#243b78] p-4 text-white transition-transform lg:static lg:w-64 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to={`/${roleLower}`} className="flex items-center gap-3 border-b border-white/10 px-2 pb-5 pt-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f58220] text-xl">✦</span>
          <div>
            <div className="font-bold tracking-tight">LearningHub</div>
            <div className="text-xs text-blue-100/70">{ROLE_LABEL[role]}</div>
          </div>
        </Link>
        <nav className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
          {sections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/60">{section.title}</div>
              {section.items.map((it: NavItem) => (
                <NavLink key={it.to} to={it.to} end={it.to === `/${roleLower}`} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition relative ${
                      isActive ? 'bg-white/15 text-white border border-white/10 shadow-sm' : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                    }`}>
                  <span>{it.icon}</span>
                  <span>{it.label}</span>
                  {it.to.includes('/notifications') && unreadCount > 0 && (
                    <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>
        <button onClick={() => { logout(); nav('/login'); }}
          className="mt-2 rounded-lg px-3 py-2 text-left text-xs text-blue-100/70 hover:bg-white/10 hover:text-white">
          ⏻ Đăng xuất
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <header className="flex items-center justify-between gap-4 bg-[#243b78] px-4 py-3 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3 text-sm text-blue-100"><button type="button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)} className="text-xl lg:hidden">☰</button><span className="hidden truncate sm:inline">Xin chào, <span className="font-semibold text-white">{user.fullName}</span></span></div>
          <div className="hidden max-w-md flex-1 items-center rounded-full bg-white/15 px-4 py-2 text-sm text-blue-100/70 md:flex"><span className="mr-2">⌕</span><span>Tìm kiếm thông tin</span></div>
          <div className="relative flex items-center gap-3"><button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 text-sm"><span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white/60 bg-white/80 text-sm font-bold text-[#243b78]">{user.fullName?.[0] ?? '?'}</span><span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span></button>{profileOpen && <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-white p-3 text-slate-800 shadow-xl"><div className="border-b border-slate-100 pb-3"><div className="font-semibold">{user.fullName}</div><div className="text-xs text-slate-500">{ROLE_LABEL[role]}</div></div><button onClick={() => { logout(); nav('/login'); }} className="mt-2 w-full rounded-lg px-2 py-2 text-left text-sm text-rose-700 hover:bg-rose-50">⏻ Đăng xuất</button></div>}</div>
        </header>
        <div className="min-h-[calc(100vh-61px)] rounded-tl-[28px] bg-linear-to-br from-[#eef3ff] via-[#f7f9ff] to-[#dfe8ff] p-4 sm:p-6"><Outlet /></div>
      </main>
    </div>
  );
}

export const PageTitle = PageHeader;
export const Card = UiCard;
export const Spinner = LoadingState;
export const Empty = ({ msg }: { msg?: string }) => <EmptyState message={msg} />;
export const ErrorBox = ({ msg }: { msg: string }) => <ErrorState message={msg} />;
export const Pill = StatusBadge;