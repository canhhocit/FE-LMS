import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useTheme } from "../context/ThemeContext";
import * as notificationService from "../services/notificationService";
import * as authService from "../services/authService";
import * as acService from "../services/adminClassService";
import { writeStoredUser } from "../contexts/authStorage";
import type { Role, AuthUser } from "../types";
import DraggableAiCompanion from "./DraggableAiCompanion";
import {
  PageTitle as _PageTitle,
  PageHeader as _PageHeader,
  Card as _Card,
  Spinner as _Spinner,
  Empty as _Empty,
  ErrorBox as _ErrorBox,
  Badge as _Badge,
} from "./ui";
import {
  Home,
  BookOpen,
  User,
  Users,
  BarChart3,
  FileText,
  CheckCircle2,
  Calendar,
  Sparkles,
  GraduationCap,
  ClipboardList,
  ClipboardCheck,
  HelpCircle,
  Key,
  MessageSquare,
  ChevronDown,
  LogOut,
  Bell,
  Sun,
  Moon,
  Menu,
  X,
  Search,
  Eye,
  EyeOff,
} from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  permissions?: string[];
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: Record<Role, NavSection[]> = {
  STUDENT: [
    {
      title: "Tổng quan",
      items: [
        { to: "/student", label: "Trang chủ", icon: Home },
      ],
    },
    {
      title: "Học tập",
      items: [
        { to: "/student/classes", label: "Lớp học", icon: BookOpen },
        { to: "/student/assignments", label: "Bài tập", icon: ClipboardCheck },
        { to: "/student/quizzes", label: "Bài kiểm tra", icon: HelpCircle },
      ],
    },
    {
      title: "Học vụ",
      items: [
        { to: "/student/registration", label: "Đăng ký học", icon: ClipboardList },
        { to: "/student/schedule", label: "Thời khóa biểu", icon: Calendar },
        { to: "/student/tuition", label: "Học phí", icon: FileText },
      ],
    },
    {
      title: "Kết quả",
      items: [
        { to: "/student/grades", label: "Kết quả học tập", icon: BarChart3 },
        { to: "/student/attendance", label: "Điểm danh", icon: CheckCircle2 },
        { to: "/student/transcript", label: "Bảng điểm", icon: GraduationCap },
      ],
    },
    {
      title: "Tương tác",
      items: [
        { to: "/student/forum", label: "Diễn đàn", icon: MessageSquare },
        { to: "/student/notifications", label: "Thông báo", icon: Bell },
      ],
    },
    {
      title: "Công cụ học tập",
      items: [
        { to: "/student/documents", label: "Kho Biểu mẫu & Đơn", icon: FileText },
        { to: "/student/ai-advisor", label: "Cố vấn học tập AI", icon: Sparkles },
      ],
    },
    {
      title: "Cá nhân",
      items: [
        { to: "/student/profile", label: "Hồ sơ cá nhân", icon: User },
      ],
    },
  ],
  LECTURER: [
    {
      title: "Tổng quan",
      items: [
        { to: "/lecturer", label: "Trang chủ", icon: Home },
      ],
    },
    {
      title: "Giảng dạy",
      items: [
        { to: "/lecturer/classes", label: "Lớp giảng dạy", icon: BookOpen },
        { to: "/lecturer/assignments", label: "Bài tập", icon: FileText },
        { to: "/lecturer/quizzes", label: "Bài kiểm tra", icon: HelpCircle },
        { to: "/lecturer/grading", label: "Chấm điểm", icon: CheckCircle2 },
        { to: "/lecturer/homeroom", label: "Điểm rèn luyện (GVCN)", icon: Users },
        { to: "/lecturer/schedule", label: "Lịch dạy", icon: Calendar },
        { to: "/lecturer/analytics", label: "Báo cáo Analytics", icon: BarChart3 },
      ],
    },
    {
      title: "Tương tác & quyền",
      items: [
        { to: "/lecturer/forum", label: "Diễn đàn", icon: MessageSquare },
        { to: "/lecturer/notifications", label: "Thông báo", icon: Bell },
        { to: "/lecturer/permission-requests", label: "Yêu cầu cấp quyền", icon: Key },
      ],
    },
    {
      title: "Tài liệu",
      items: [
        { to: "/lecturer/documents", label: "Kho Biểu mẫu & Đơn", icon: FileText },
      ],
    },
    {
      title: "Cá nhân",
      items: [
        { to: "/lecturer/profile", label: "Hồ sơ", icon: User },
      ],
    },
  ],
  ADMIN: [
    {
      title: "Tổng quan",
      items: [
        { to: "/admin", label: "Dashboard", icon: Home },
      ],
    },
    {
      title: "Đào tạo",
      items: [
        { to: "/admin/curricula", label: "Chương trình ĐT", icon: GraduationCap, permission: "MANAGE_CURRICULUM" },
        { to: "/admin/departments", label: "Khoa/Bộ môn", icon: Users, permission: "MANAGE_CURRICULUM" },
        { to: "/admin/administrative-classes", label: "Lớp hành chính", icon: Users, permission: "MANAGE_USERS" },
        { to: "/admin/registration", label: "Đợt đăng ký", icon: ClipboardList, permission: "MANAGE_REGISTRATION" },
        { to: "/admin/classes", label: "Lớp học phần", icon: BookOpen, permission: "MANAGE_REGISTRATION" },
        { to: "/admin/tuition", label: "Quản lý học phí", icon: FileText, permission: "MANAGE_TUITION" },
      ],
    },
    {
      title: "Người dùng & hệ thống",
      items: [
        { to: "/admin/users", label: "Người dùng", icon: Users, permission: "MANAGE_USERS" },
        { to: "/admin/permissions", label: "Quản trị & Phân quyền", icon: Key, permission: "SYSTEM_CONFIG" },
        { to: "/admin/clazz-permissions", label: "Phân quyền lớp học", icon: Key },
        { to: "/admin/audit-logs", label: "Nhật ký hệ thống", icon: FileText, permissions: ["SYSTEM_CONFIG", "VIEW_SYSTEM_LOGS"] },
      ],
    },
    {
      title: "Báo cáo & phê duyệt",
      items: [
        { to: "/admin/reports", label: "Báo cáo", icon: BarChart3, permission: "VIEW_REPORTS" },
        { to: "/admin/pbac-approvals", label: "Quyền hạn", icon: Key, permission: "MANAGE_GRADING_POLICY" },
        { to: "/admin/documents", label: "Kho Biểu mẫu & Đơn", icon: FileText },
        { to: "/admin/notifications", label: "Thông báo", icon: Bell },
      ],
    },
  ],
};

const ROLE_LABEL: Record<Role, string> = {
  STUDENT: "Sinh viên",
  LECTURER: "Giảng viên",
  ADMIN: "Quản trị viên",
};

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordFormData } from '../lib/schemas';

function FirstLoginModal({
  user,
  onComplete,
}: {
  user: AuthUser;
  onComplete: () => void;
}) {
  const { logout, updateUser } = useAuth();
  const [showOldPw, setShowOldPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { oldPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onChangePwSubmit = async (data: ChangePasswordFormData) => {
    setErr(null);
    setSaving(true);
    try {
      await authService.changePassword({ oldPassword: data.oldPassword, newPassword: data.newPassword });
      const updated = { ...user, isFirstLogin: false, firstLogin: false };
      updateUser(updated);
      writeStoredUser(updated);
      onComplete();
    } catch (e: unknown) {
      setErr(
        (e as { message?: string })?.message ??
          "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-modal dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-950/50 dark:text-accent-400 border border-accent-100 dark:border-accent-900">
            <Key className="h-5 w-5" />
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Đổi mật khẩu lần đầu
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
            Vì lý do an toàn, vui lòng cập nhật mật khẩu mới khi đăng nhập lần đầu.
          </p>
        </div>

        {err && (
          <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-300">
            <span>{err}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onChangePwSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu hiện tại
            </label>
            <div className="relative">
              <input
                type={showOldPw ? "text" : "password"}
                {...register('oldPassword')}
                placeholder="Nhập mật khẩu hiện tại"
                className={`w-full px-3.5 py-2 border rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none transition ${
                  errors.oldPassword
                    ? 'border-rose-300 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-accent-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowOldPw(!showOldPw)}
                title={showOldPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
              >
                {showOldPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.oldPassword && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.oldPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showNewPw ? "text" : "password"}
                {...register('newPassword')}
                placeholder="Nhập mật khẩu mới"
                className={`w-full px-3.5 py-2 border rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none transition ${
                  errors.newPassword
                    ? 'border-rose-300 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-accent-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPw(!showNewPw)}
                title={showNewPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
              >
                {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.newPassword.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <input
                type={showConfirmPw ? "text" : "password"}
                {...register('confirmPassword')}
                placeholder="Xác nhận mật khẩu mới"
                className={`w-full px-3.5 py-2 border rounded-lg text-xs bg-white dark:bg-slate-800 dark:text-white outline-none transition ${
                  errors.confirmPassword
                    ? 'border-rose-300 focus:border-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:border-accent-600'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                title={showConfirmPw ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition cursor-pointer"
              >
                {showConfirmPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="w-full py-2 rounded-lg font-semibold text-xs bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-50 transition cursor-pointer flex items-center justify-center gap-2"
            >
              {saving ? "Đang lưu mật khẩu..." : "Cập nhật mật khẩu"}
            </button>
          </div>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
          <button
            type="button"
            onClick={() => {
              logout();
              window.location.href = "/login";
            }}
            className="text-xs text-slate-500 hover:text-rose-600 dark:text-slate-400 font-medium transition cursor-pointer"
          >
            Đăng xuất tài khoản
          </button>
        </div>
      </div>
    </div>
  );
}

import SmartSearchModal from "./SmartSearchModal";

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const darkMode = theme === 'dark';
  const { user, logout, hasPermission } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lms_sidebar_collapsed') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('lms_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showFirstLoginModal, setShowFirstLoginModal] = useState<boolean>(
    () => {
      return !!(user && (user.isFirstLogin || user.firstLogin));
    },
  );

  const [isGvcn, setIsGvcn] = useState<boolean>(false);

  const [openSections, setOpenSections] = useState<Record<string, { open: boolean; path: string }>>({});

  const toggleSection = (title: string, isActiveSection: boolean) => {
    setOpenSections((prev) => {
      const saved = prev[title];
      const isOpen = saved?.path === location.pathname
        ? saved.open
        : isActiveSection || Boolean(saved?.open);
      return { ...prev, [title]: { open: !isOpen, path: location.pathname } };
    });
  };

  useEffect(() => {
    let mounted = true;
    if (user?.role === "LECTURER") {
      acService
        .getAllAdminClasses()
        .then((classes) => {
          if (!mounted) return;
          const check = classes.some(
            (c) =>
              c.homeroomTeacherId === user.id ||
              (user.lecturerCode && c.homeroomTeacherCode === user.lecturerCode) ||
              (user.fullName && (c.homeroomTeacherName === user.fullName || c.advisorName === user.fullName))
          );
          setIsGvcn(check);
        })
        .catch(() => {
          if (mounted) setIsGvcn(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [user?.role, user?.id, user?.lecturerCode, user?.fullName]);

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
      if (typeof nextCount === "number") {
        if (mounted) setUnreadCount(nextCount);
        return;
      }
      void loadUnreadCount();
    };

    void loadUnreadCount();
    window.addEventListener(
      "notifications:updated",
      handleNotificationsUpdated,
    );
    const interval = setInterval(loadUnreadCount, 30000);
    return () => {
      mounted = false;
      window.removeEventListener(
        "notifications:updated",
        handleNotificationsUpdated,
      );
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleOpenSearch = () => setIsSearchOpen(true);
    window.addEventListener("open-smart-search", handleOpenSearch);
    return () => window.removeEventListener("open-smart-search", handleOpenSearch);
  }, []);

  if (!user) return null;
  const role = user.role;
  const sections = NAV[role];
  const roleLower = role.toLowerCase();

  const openAiCompanion = () => {
    window.dispatchEvent(new CustomEvent('lms_open_ai_companion'));
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Đóng menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex h-full shrink-0 flex-col border-r border-slate-200/90 bg-white p-4 text-slate-800 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 lg:static lg:h-screen lg:translate-x-0 lg:shadow-none transition-all duration-300 ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        } ${isCollapsed ? "lg:w-[4.5rem] lg:px-2 lg:items-center" : "lg:w-64"}`}
      >
        {/* Sidebar Brand Header */}
        <div className={`flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4 pt-1 ${isCollapsed ? "px-0 justify-center w-full" : "px-1 w-full"}`}>
          <Link
            to={`/${roleLower}`}
            className="flex items-center gap-3"
          >
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary-600 text-white shadow-xs">
              <GraduationCap className="h-5 w-5 text-white" />
            </span>
            <div className={`${isCollapsed ? "hidden lg:hidden" : "block"}`}>
              <div className="font-bold tracking-tight text-slate-900 dark:text-white text-base leading-tight">
                LearningHub
              </div>
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                {ROLE_LABEL[role]}
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 lg:hidden rounded-lg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {sections.map((section) => {
            const filteredItems = section.items.filter(
              (it) =>
                (!it.permission || hasPermission(it.permission)) &&
                (!it.permissions || it.permissions.some(hasPermission)) &&
                (it.to !== "/lecturer/homeroom" || isGvcn),
            );
            if (filteredItems.length === 0) return null;
            const roleRoot = `/${role.toLowerCase()}`;
            const isActiveSection = filteredItems.some((item) =>
              location.pathname === item.to ||
              (item.to !== roleRoot && location.pathname.startsWith(`${item.to}/`)),
            );
            const savedSection = openSections[section.title];
            const isSectionOpen = savedSection?.path === location.pathname
              ? savedSection.open
              : isActiveSection || Boolean(savedSection?.open);

            return (
              <div key={section.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleSection(section.title, isActiveSection)}
                  className={`flex w-full items-center justify-between py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition cursor-pointer ${isCollapsed ? "px-0 justify-center h-0 opacity-0 overflow-hidden" : "px-2"}`}
                >
                  <span className={isCollapsed ? "hidden" : "block"}>{section.title}</span>
                  <ChevronDown
                    className={`h-3 w-3 transform transition-transform duration-150 ${
                      isSectionOpen ? "" : "-rotate-90"
                    } ${isCollapsed ? "hidden" : "block"}`}
                  />
                </button>

                {(isSectionOpen || isCollapsed) && (
                  <div className="space-y-0.5 mt-1">
                    {filteredItems.map((it: NavItem) => {
                      const IconComponent = it.icon;
                      return (
                        <NavLink
                          key={it.to}
                          to={it.to}
                          end={it.to === `/${roleLower}`}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            `relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${isCollapsed ? "justify-center px-0 w-full" : ""} ${
                              isActive
                                ? "bg-primary-600 text-white shadow-2xs"
                                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                            }`
                          }
                          title={isCollapsed ? it.label : undefined}
                        >
                          <div className="relative flex items-center justify-center">
                            <IconComponent className="h-4 w-4 shrink-0" />
                          </div>
                          <span className={`truncate ${isCollapsed ? "hidden" : "block"}`}>{it.label}</span>
                          {it.to.includes("/notifications") && unreadCount > 0 && (
                            <span className={isCollapsed ? "absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500" : "ml-auto inline-flex items-center justify-center px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-bold"}>
                              {!isCollapsed && (unreadCount > 99 ? "99+" : unreadCount)}
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

        {/* Sidebar Footer */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => {
              logout();
              nav("/login");
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 transition w-full cursor-pointer ${isCollapsed ? "justify-center px-0" : ""}`}
            title={isCollapsed ? "Đăng xuất" : undefined}
          >
            <LogOut className="h-4 w-4" />
            <span className={isCollapsed ? "hidden" : "block"}>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content Layout */}
      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-14 w-full shrink-0 items-center justify-between gap-4 border-b border-slate-200/90 bg-white/95 px-4 py-2.5 text-slate-800 backdrop-blur-xs dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Mở menu"
              onClick={() => {
                 if (window.innerWidth >= 1024) {
                    setIsCollapsed(prev => !prev);
                 } else {
                    setSidebarOpen(true);
                 }
              }}
              className="p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="hidden truncate text-xs text-slate-500 dark:text-slate-400 sm:inline">
              Xin chào, <span className="font-semibold text-slate-900 dark:text-white">{user.fullName}</span>
            </span>
          </div>

          {/* Quick Search */}
          <button 
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="hidden max-w-sm flex-1 items-center justify-between rounded-lg bg-slate-100/90 border border-slate-200/80 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-200/50 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700/80 dark:text-slate-400 dark:hover:bg-slate-700/50 dark:hover:text-slate-300 md:flex transition cursor-pointer"
          >
            <div className="flex items-center">
              <Search className="mr-2 h-3.5 w-3.5 opacity-60 shrink-0" />
              <span className="truncate">Tìm kiếm thông tin...</span>
            </div>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 shadow-xs">
              Ctrl K
            </kbd>
          </button>

          {/* Header Action Items */}
          <div className="relative flex items-center gap-2">
            {/* Ask AI Button */}
            <button
              type="button"
              onClick={openAiCompanion}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              title="Mở Trợ lý AI"
            >
              <Sparkles className="h-3.5 w-3.5 text-accent-600 dark:text-accent-400" />
              <span className="hidden sm:inline">Hỏi AI</span>
            </button>

            {/* Notification Bell */}
            <Link
              to={`/${roleLower}/notifications`}
              title="Thông báo"
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>

            {/* Theme Switcher */}
            <button
              type="button"
              onClick={toggleTheme}
              title={darkMode ? "Chuyển Chế độ Sáng" : "Chuyển Chế độ Tối"}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
            >
              {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-600" />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((open) => !open)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-750 transition cursor-pointer"
              >
                <User className="h-3.5 w-3.5 text-slate-500" />
                <span className="hidden max-w-28 truncate sm:inline">
                  {user.fullName}
                </span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-11 z-50 w-52 rounded-xl border border-slate-200/90 bg-white p-3 text-slate-800 shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                      {user.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {ROLE_LABEL[role]}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      nav("/login");
                    }}
                    className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-y-auto bg-slate-50/80 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {showFirstLoginModal && user && (
        <FirstLoginModal
          user={user}
          onComplete={() => setShowFirstLoginModal(false)}
        />
      )}

      <SmartSearchModal open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      <DraggableAiCompanion />
    </div>
  );
}

export const PageTitle = _PageTitle;
export const PageHeader = _PageHeader;
export const Card = _Card;
export const Spinner = _Spinner;
export const Empty = ({ msg, message }: { msg?: string; message?: string }) => (
  <_Empty msg={msg} message={message} />
);
export const ErrorBox = ({ msg, message }: { msg?: string; message?: string }) => (
  <_ErrorBox msg={msg} message={message} />
);
export const Pill = _Badge;
