import { useState, useEffect, type ReactNode } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import * as notificationService from '../services/notificationService';
import * as authService from '../services/authService';
import { writeStoredUser } from '../contexts/authStorage';
import type { Role, AuthUser } from '../types';

const SunIcon = ({ className = 'h-4.5 w-4.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = ({ className = 'h-4.5 w-4.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
  </svg>
);

const PageHeader = ({ children }: { children: ReactNode }) => (
  <h1 className="text-xl font-bold text-slate-900 dark:text-[#63a1ff] mb-4">{children}</h1>
);

const UiCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </div>
);

const LoadingState = () => (
  <div className="flex h-32 items-center justify-center text-[#00376f] dark:text-[#63a1ff]">
    <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
  </div>
);

const EmptyState = ({ message = 'Không có dữ liệu' }: { message?: string }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
    {message}
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
    {message}
  </div>
);

const StatusBadge = (props: { children: ReactNode; intent?: 'success' | 'warn' | 'error' | 'neutral'; color?: string }) => {
  const { children, intent = 'neutral' } = props;
  const styles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60',
    warn: 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60',
    error: 'bg-rose-50 text-rose-700 border border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700/60',
  }[intent];
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles}`}>{children}</span>;
};

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

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const BarChartIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const FileTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const BrainIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const GraduationCapIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
  </svg>
);

const ClipboardListIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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

const BellIcon = ({ className = 'h-4.5 w-4.5' }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} width="18" height="18">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
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
        { to: '/student/notifications', label: 'Thông báo', icon: BellIcon },
        { to: '/student/classes', label: 'Lớp học', icon: BookOpenIcon },
        { to: '/student/schedule', label: 'Thời khoá biểu', icon: CalendarIcon },
        { to: '/student/grades', label: 'Kết quả học tập', icon: BarChartIcon },
        { to: '/student/tuition', label: 'Học phí', icon: FileTextIcon },
        { to: '/student/registration', label: 'Đăng ký học', icon: BookOpenIcon },
        { to: '/student/ai-advisor', label: 'Cố vấn học tập AI', icon: BrainIcon },
      ],
    },
    {
      title: 'Cá nhân',
      items: [
        { to: '/student/profile', label: 'Hồ sơ cá nhân', icon: UserIcon }
      ],
    },
  ],
  LECTURER: [
    {
      title: 'Tổng quan',
      items: [
        { to: '/lecturer', label: 'Trang chủ', icon: HomeIcon },
        { to: '/lecturer/notifications', label: 'Thông báo', icon: BellIcon },
        { to: '/lecturer/classes', label: 'Lớp giảng dạy', icon: BookOpenIcon },
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
        { to: '/admin/notifications', label: 'Thông báo', icon: BellIcon },
        { to: '/admin/users', label: 'Người dùng', icon: UsersIcon },
        { to: '/admin/reports', label: 'Báo cáo', icon: BarChartIcon },
        { to: '/admin/audit-logs', label: 'Nhật ký hệ thống', icon: FileTextIcon },
        { to: '/admin/permissions', label: 'Phân quyền', icon: KeyIcon, permission: 'SYSTEM_CONFIG' },
      ],
    },
    {
      title: 'Đào tạo',
      items: [
        { to: '/admin/curricula', label: 'Chương trình ĐT', icon: GraduationCapIcon },
        { to: '/admin/departments', label: 'Khoa/Bộ môn', icon: UsersIcon },
        { to: '/admin/administrative-classes', label: 'Lớp hành chính', icon: UsersIcon },
        { to: '/admin/registration', label: 'Đợt đăng ký', icon: ClipboardListIcon },
        { to: '/admin/classes', label: 'Lớp học phần', icon: BookOpenIcon },
        { to: '/admin/clazz-permissions', label: 'Phân quyền lớp học', icon: KeyIcon },
      ],
    },
  ],
};

const ROLE_LABEL: Record<Role, string> = { STUDENT: 'Sinh viên', LECTURER: 'Giảng viên', ADMIN: 'Quản trị' };

function FirstLoginModal({ user, onComplete }: { user: AuthUser; onComplete: () => void }) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!oldPassword) {
      setErr('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }
    if (newPassword.length < 6) {
      setErr('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/]/.test(newPassword);
    if (!hasSpecial) {
      setErr('Mật khẩu mới phải chứa ít nhất 1 ký tự đặc biệt (VD: @, #, $, !...).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr('Mật khẩu xác nhận không khớp.');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword({ oldPassword, newPassword });
      const updated = { ...user, isFirstLogin: false, firstLogin: false };
      writeStoredUser(updated);
      onComplete();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 text-2xl font-bold">
            🔑
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Đổi mật khẩu lần đầu</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Tài khoản của bạn vừa đăng nhập lần đầu với mật khẩu mặc định (VD: <code className="font-semibold text-slate-700 dark:text-slate-300">123456</code>). Vui lòng đặt mật khẩu mới để bảo mật tài khoản.
          </p>
        </div>

        {err && <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">{err}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mật khẩu hiện tại</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Mật khẩu ban đầu (VD: 123456)"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Mật khẩu mới</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="VD: Student@123"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="mt-1 text-[11px] text-slate-400">Yêu cầu: Tối thiểu 6 ký tự và có ít nhất 1 ký tự đặc biệt (@, #, $, !...)</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition shadow-sm"
          >
            {saving ? 'Đang cập nhật...' : 'Xác nhận & Đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Layout() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);
  const { user, logout, hasPermission } = useAuth();
  const nav = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState<boolean>(() => {
    return !!(user && (user.isFirstLogin || user.firstLogin));
  });

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
    const interval = setInterval(loadUnreadCount, 30000);
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
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-sky-200 bg-blue-300 p-4 text-slate-800 shadow-xl transition-transform dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:static lg:w-64 lg:translate-x-0 lg:shadow-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Link to={`/${roleLower}`} className="flex items-center gap-3 border-b border-red dark:border-slate-800 px-2 pb-5 pt-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-600 text-white text-xl font-bold shadow-xs">✦</span>
          <div>
            <div className="font-bold tracking-tight text-slate-900 dark:text-white">LearningHub</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[role]}</div>
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
                <button
                  type="button"
                  onClick={() => toggleSection(section.title)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 transition group"
                >
                  <span>{section.title}</span>
                  <ChevronDownIcon
                    className={`h-3 w-3 transform transition-transform duration-200 ${
                      isSectionOpen ? '' : '-rotate-90'
                    } text-slate-500 dark:text-slate-500 group-hover:text-slate-800 dark:group-hover:text-slate-300`}
                  />
                </button>

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
                            `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition relative ${
                              isActive
                                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                                : 'text-slate-700 hover:bg-sky-200/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white'
                            }`
                          }
                        >
                          <IconComponent className="h-4.5 w-4.5 shrink-0 opacity-80" />
                          <span>{it.label}</span>
                          {it.to.includes('/notifications') && unreadCount > 0 && (
                            <span className="ml-auto inline-flex items-center justify-center h-5 w-5 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs">
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
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-600 hover:bg-sky-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition w-full"
        >
          <LogOutIcon className="h-4 w-4 opacity-75" />
          <span>Đăng xuất</span>
        </button>
      </aside>
      <main className="min-w-0 flex-1 overflow-auto">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-sky-200 bg-blue-300 px-4 py-3 text-slate-800 shadow-2xs backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-100 sm:px-6">
          <div className="flex min-w-0 items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <button type="button" aria-label="Mở menu" onClick={() => setSidebarOpen(true)} className="text-xl lg:hidden text-slate-700 dark:text-slate-200">
              ☰
            </button>
            <span className="hidden truncate sm:inline">
              Xin chào, <span className="font-semibold text-slate-900 dark:text-white">{user.fullName}</span>
            </span>
          </div>
          <div className="hidden max-w-md flex-1 items-center rounded-full bg-white/80 border border-sky-200/60 px-4 py-1.5 text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400 md:flex">
            <span className="mr-2 opacity-60">⌕</span>
            <span>Tìm kiếm thông tin...</span>
          </div>

          <div className="relative flex items-center gap-3">
            {/* Notification Bell Button */}
            <Link
              to={`/${roleLower}/notifications`}
              title="Thông báo"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-white/80 text-slate-700 shadow-xs transition hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95"
            >
              <BellIcon className="h-4.5 w-4.5 text-slate-700 dark:text-slate-200" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* SVG Dark/Light mode toggle button */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Chuyển sang Chế độ Sáng" : "Chuyển sang Chế độ Tối"}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-200 bg-white/80 text-slate-700 shadow-xs transition hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 active:scale-95"
            >
              {darkMode ? <SunIcon className="h-4.5 w-4.5 text-amber-400" /> : <MoonIcon className="h-4.5 w-4.5 text-slate-700" />}
            </button>

            {/* Profile Dropdown Header */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-2 rounded-xl border border-sky-200 bg-white/80 px-3 py-1.5 text-sm font-semibold text-slate-800 transition hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <UserIcon className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                <span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span>
                <ChevronDownIcon className="h-3.5 w-3.5 opacity-60" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-slate-200/80 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{user.fullName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{ROLE_LABEL[role]}</div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      nav('/login');
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition"
                  >
                    <LogOutIcon className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className="min-h-[calc(100vh-61px)] bg-slate-50/80 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>

      {showFirstLoginModal && user && (
        <FirstLoginModal user={user} onComplete={() => setShowFirstLoginModal(false)} />
      )}
    </div>
  );
}

export const PageTitle = PageHeader;
export const Card = UiCard;
export const Spinner = LoadingState;
export const Empty = ({ msg }: { msg?: string }) => <EmptyState message={msg} />;
export const ErrorBox = ({ msg }: { msg: string }) => <ErrorState message={msg} />;
export const Pill = StatusBadge;
