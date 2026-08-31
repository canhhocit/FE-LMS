// Layout chung: sidebar + topbar + content. Items lọc theo role.
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/useAuth';
import * as notificationService from '../services/notificationService';
import type { Role } from '../types';
import { Card as UiCard, ErrorState, EmptyState, LoadingState, PageHeader, StatusBadge } from './ui';

// Beautiful inline SVG Icons - No external dependency needed for robustness
const HomeIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const BrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const BarChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const CreditCardIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const GraduationCapIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
  </svg>
);

const KeyIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m-5 4a5 5 0 01-5-5 5 5 0 015-5 5 5 0 015 5 5 5 0 01-5 5zm0 0v1a2 2 0 01-2 2h-2a2 2 0 00-2 2v3h2v-2h2v-2h2a2 2 0 002-2v-1.333a5.05 5.05 0 001.36-.67l1.36 1.36a1 1 0 001.414 0l1.414-1.414a1 1 0 000-1.414l-1.36-1.36a5.05 5.05 0 00.67-1.36H15z" />
  </svg>
);

const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: Record<Role, NavSection[]> = {
  STUDENT: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/student', label: 'Trang chủ', icon: HomeIcon },
        { to: '/student/classes', label: 'Lớp học', icon: BookOpenIcon },
        { to: '/student/notifications', label: 'Thông báo', icon: BellIcon },
      ],
    },
    {
      title: 'Học tập',
      items: [
        { to: '/student/assignments', label: 'Bài tập', icon: FileTextIcon },
        { to: '/student/quizzes', label: 'Quiz', icon: BrainIcon },
        { to: '/student/grades', label: 'Điểm', icon: BarChartIcon },
        { to: '/student/schedule', label: 'Lịch học', icon: CalendarIcon },
      ],
    },
    {
      title: 'Cá nhân',
      items: [
        { to: '/student/profile', label: 'Hồ sơ', icon: UserIcon },
        { to: '/student/registrations', label: 'Đăng ký', icon: ClipboardListIcon },
        { to: '/student/tuition', label: 'Học phí', icon: CreditCardIcon },
      ],
    },
  ],
  LECTURER: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/lecturer', label: 'Trang chủ', icon: HomeIcon },
        { to: '/lecturer/classes', label: 'Lớp học', icon: BookOpenIcon },
        { to: '/lecturer/notifications', label: 'Thông báo', icon: BellIcon },
      ],
    },
    {
      title: 'Quản lý',
      items: [
        { to: '/lecturer/assignments', label: 'Bài tập', icon: FileTextIcon },
        { to: '/lecturer/quizzes', label: 'Quiz', icon: BrainIcon },
        { to: '/lecturer/grading', label: 'Chấm điểm', icon: CheckCircleIcon },
        { to: '/lecturer/schedule', label: 'Lịch dạy', icon: CalendarIcon },
      ],
    },
    {
      title: 'Cá nhân',
      items: [
        { to: '/lecturer/profile', label: 'Hồ sơ', icon: UserIcon }
      ],
    },
  ],
  ADMIN: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/admin', label: 'Dashboard', icon: HomeIcon },
        { to: '/admin/users', label: 'Người dùng', icon: UsersIcon },
        { to: '/admin/reports', label: 'Báo cáo', icon: BarChartIcon },
        { to: '/admin/permissions', label: 'Phân quyền', icon: KeyIcon, permission: 'SYSTEM_CONFIG' },
      ],
    },
    {
      title: 'Đào tạo',
      items: [
        { to: '/admin/curricula', label: 'Chương trình ĐT', icon: GraduationCapIcon },
        { to: '/admin/registration', label: 'Đợt đăng ký', icon: ClipboardListIcon },
        { to: '/admin/classes', label: 'Lớp học', icon: BookOpenIcon },
      ],
    },
  ],
};

const ROLE_LABEL: Record<Role, string> = { STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị' };

export default function Layout() {
  const { user, logout, hasPermission } = useAuth();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Accordion state for sidebar categories - Default all to expanded/open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    'Tổng quan': true,
    'Học tập': true,
    'Cá nhân': true,
    'Quản lý': true,
    'Đào tạo': true,
  }));

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

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

    const handleNotificationsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ count?: number }>;
      const nextCount = customEvent.detail?.count;
      if (typeof nextCount === 'number') {
        if (mounted) setUnreadCount(nextCount);
        return;
      }
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
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f58220] text-xl font-bold">✦</span>
          <div>
            <div className="font-bold tracking-tight">LearningHub</div>
            <div className="text-xs text-blue-100/70">{ROLE_LABEL[role]}</div>
          </div>
        </Link>
        <nav className="mt-6 flex-1 space-y-4 overflow-y-auto pr-1">
          {sections.map((section) => {
            const filteredItems = section.items.filter(
              (it) => !it.permission || hasPermission(it.permission)
            );
            if (filteredItems.length === 0) return null;
            const isSectionOpen = openSections[section.title] ?? true;

            return (
              <div key={section.title} className="space-y-1">
                {/* Collapsible Section Header Button */}
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-100/60 hover:text-white transition group"
                >
                  <span>{section.title}</span>
                  <ChevronDownIcon
                    className={`h-3 w-3 transform transition-transform duration-200 ${
                      isSectionOpen ? '' : '-rotate-90'
                    } text-blue-100/40 group-hover:text-white`}
                  />
                </button>

                {/* Sub Menu Links wrapper */}
                {isSectionOpen && (
                  <div className="space-y-1 mt-1 transition-all duration-200">
                    {filteredItems.map((it: NavItem) => {
                      const IconComponent = it.icon;
                      return (
                        <NavLink
                          key={it.to}
                          to={it.to}
                          end={it.to === `/${roleLower}`}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition relative ${
                              isActive
                                ? 'bg-white/15 text-white border border-white/10 shadow-sm'
                                : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
                            }`
                          }
                        >
                          <IconComponent className="h-4.5 w-4.5 shrink-0 opacity-80" />
                          <span>{it.label}</span>
                          {it.to.includes('/notifications') && unreadCount > 0 && (
                            <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold">
                              {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        <button
          onClick={() => {
            logout();
            nav('/login');
          }}
          className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-blue-100/70 hover:bg-white/10 hover:text-white w-full"
        >
          <LogOutIcon className="h-4 w-4 opacity-75" />
          <span>Đăng xuất</span>
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <header className="flex items-center justify-between gap-4 bg-[#243b78] px-4 py-3 text-white sm:px-6">
          <div className="flex min-w-0 items-center gap-3 text-sm text-blue-100">
            <button type="button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)} className="text-xl lg:hidden">
              ☰
            </button>
            <span className="hidden truncate sm:inline">
              Xin chào, <span className="font-semibold text-white">{user.fullName}</span>
            </span>
          </div>
          <div className="hidden max-w-md flex-1 items-center rounded-full bg-white/15 px-4 py-2 text-sm text-blue-100/70 md:flex">
            <span className="mr-2">⌕</span>
            <span>Tìm kiếm thông tin</span>
          </div>
          <div className="relative flex items-center gap-3">
            <button type="button" onClick={() => setProfileOpen((open) => !open)} className="flex items-center gap-2 text-sm">
              <span className="grid h-9 w-9 overflow-hidden rounded-full border-2 border-white/60 bg-white/80 text-sm font-bold text-[#243b78]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">{user.fullName?.[0] ?? '?'}</span>
                )}
              </span>
              <span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span>
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-xl bg-white p-3 text-slate-800 shadow-xl">
                <div className="border-b border-slate-100 pb-3">
                  <div className="font-semibold">{user.fullName}</div>
                  <div className="text-xs text-slate-500">{ROLE_LABEL[role]}</div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    nav('/login');
                  }}
                  className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                >
                  <LogOutIcon className="h-4 w-4" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <div className="min-h-[calc(100vh-61px)] rounded-tl-[28px] bg-linear-to-br from-[#eef3ff] via-[#f7f9ff] to-[#dfe8ff] p-4 sm:p-6">
          <Outlet />
        </div>
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