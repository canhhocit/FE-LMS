import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, ClipboardList, Calendar, Key, Building2, Zap,
  Plus, Upload, Download, RotateCcw, Trash2, Edit3, Search, Filter, AlertCircle, CheckCircle2
} from 'lucide-react';
import * as clazzService from '../../services/clazzService';
import * as adminService from '../../services/adminService';
import { importUsersByRole, exportUsersByRole, resetPassword, createUser, updateUser, updateUserStatus, deleteUser, type UserCreateRequest } from '../../services/userService';
import * as adminClassService from '../../services/adminClassService';
import type { AdminClassResponse } from '../../services/adminClassService';
import { getDepartments, type DepartmentResponse } from '../../services/departmentService';
import * as scheduleService from '../../services/scheduleService';
import type { Clazz, User, DashboardStats, Schedule } from '../../types';
import { PageHeader, StatCard, Card, Button, Input, Select, Badge, Modal, Spinner, Empty } from '../../components/ui';

const DAY_NAMES: Record<number, string> = {
  1: 'Thứ 2',
  2: 'Thứ 3',
  3: 'Thứ 4',
  4: 'Thứ 5',
  5: 'Thứ 6',
  6: 'Thứ 7',
  7: 'Chủ nhật',
};

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '06:45', end: '07:30' },
  2: { start: '07:40', end: '08:25' },
  3: { start: '08:35', end: '09:25' },
  4: { start: '09:30', end: '10:15' },
  5: { start: '10:25', end: '11:10' },
  6: { start: '11:20', end: '12:10' },
  7: { start: '12:30', end: '13:15' },
  8: { start: '13:25', end: '14:10' },
  9: { start: '14:20', end: '15:10' },
  10: { start: '15:15', end: '16:00' },
  11: { start: '16:10', end: '16:55' },
  12: { start: '17:05', end: '17:55' },
};

/* ==========================================================================
   1. ADMIN DASHBOARD
   ========================================================================== */
export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let m = true;
    adminService.getDashboardStats().then((s) => m && setStats(s)).finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);

  if (loading) return <Spinner />;
  if (!stats) return null;

  const quickActions = [
    { title: 'Xếp lịch giảng dạy', desc: 'Phân ca, phòng học & lịch học phần', link: '/admin/classes', Icon: Calendar, badge: 'Admin/Manager' },
    { title: 'Phân quyền Manager & PBAC', desc: 'Duyệt quyền quản trị viên & cấp quyền', link: '/admin/pbac-approvals', Icon: Key, badge: 'Super Admin' },
    { title: 'Quản lý Lớp hành chính', desc: 'Gán GVCN, quản lý danh sách sinh viên', link: '/admin/administrative-classes', Icon: Building2, badge: 'Quản lý' },
    { title: 'Đợt Đăng ký Học tập', desc: 'Mở/khóa đợt đăng ký môn học phần', link: '/admin/registration', Icon: ClipboardList, badge: 'Đợt mới' },
    { title: 'Người dùng & Tài khoản', desc: 'Tạo tài khoản, import Excel, reset MK', link: '/admin/users', Icon: Users, badge: 'Tài khoản' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Dashboard Quản Trị Hệ Thống"
        subtitle="Học kỳ hiện tại: HK1 (2026-2027) • Hệ thống LMS LearningHub"
      />

      {/* Main Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Tổng người dùng"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
          trend="Hệ thống LMS"
          trendColor="emerald"
          color="accent"
        />
        <StatCard
          label="Lớp môn học"
          value={stats.totalClasses.toLocaleString()}
          icon={<BookOpen className="w-5 h-5" />}
          trend="Đang mở"
          trendColor="emerald"
          color="emerald"
        />
        <StatCard
          label="Lượt đăng ký học"
          value={stats.totalEnrollments.toLocaleString()}
          icon={<ClipboardList className="w-5 h-5" />}
          trend="Học kỳ HK1"
          trendColor="emerald"
          color="amber"
        />
      </div>

      {/* Quick Access Management Actions */}
      <div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          Phím Tắt & Tác Vụ Quản Trị Nhanh
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((act) => {
            const IconComp = act.Icon;
            return (
              <Link key={act.title} to={act.link}>
                <Card className="h-full hover:border-navy-300 dark:hover:border-navy-600 transition-all cursor-pointer group">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-navy-50 dark:bg-navy-950/60 text-navy-900 dark:text-navy-300 group-hover:scale-110 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <Badge variant="info">{act.badge}</Badge>
                  </div>
                  <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm mt-3 group-hover:text-navy-900 dark:group-hover:text-navy-300 transition-colors">
                    {act.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {act.desc}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   2. ADMIN USERS
   ========================================================================== */
export function AdminUsers() {
  const [tab, setTab] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
  const [kw, setKw] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [adminClasses, setAdminClasses] = useState<AdminClassResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Pagination State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [submittingUser, setSubmittingUser] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const [userForm, setUserForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'STUDENT' as 'STUDENT' | 'LECTURER',
    studentCode: '',
    lecturerCode: '',
    classMode: 'EXISTING' as 'EXISTING' | 'NEW',
    adminClassId: '',
    adminClassName: '',
    faculty: '',
    dateOfBirth: '',
    active: true,
  });

  useEffect(() => {
    adminClassService.getAllAdminClasses().then((list) => setAdminClasses(list)).catch(() => setAdminClasses([]));
    getDepartments().then((deps) => setDepartments(deps)).catch(() => setDepartments([]));
  }, []);

  const load = useCallback(() => {
    let mounted = true;
    setLoading(true);
    const p = tab === 'STUDENT' 
      ? adminService.listStudentsPage(kw, selectedClass, page, pageSize) 
      : adminService.listLecturersPage(kw, page, pageSize);
      
    p.then((res) => {
      if (!mounted) return;
      setUsers(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    }).catch(() => {
      if (!mounted) return;
      setUsers([]);
      setTotalPages(0);
      setTotalElements(0);
    }).finally(() => mounted && setLoading(false));
    
    return () => { mounted = false; };
  }, [tab, kw, selectedClass, page, pageSize]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setEditingUser(null);
    setUserForm({
      fullName: '',
      email: '',
      password: '',
      role: tab,
      studentCode: '',
      lecturerCode: '',
      classMode: 'EXISTING',
      adminClassId: adminClasses.length > 0 ? String(adminClasses[0].id) : '',
      adminClassName: '',
      faculty: departments.length > 0 ? departments[0].name : '',
      dateOfBirth: '',
      active: true,
    });
    setFormErr(null);
    setShowModal(true);
  };

  const openEditModal = (u: User) => {
    setModalMode('EDIT');
    setEditingUser(u);
    setUserForm({
      fullName: u.fullName || '',
      email: u.email || '',
      password: '',
      role: (u.role === 'LECTURER' ? 'LECTURER' : 'STUDENT') as 'STUDENT' | 'LECTURER',
      studentCode: u.studentCode || '',
      lecturerCode: u.lecturerCode || '',
      classMode: u.adminClassId ? 'EXISTING' : (u.adminClassName ? 'NEW' : 'EXISTING'),
      adminClassId: u.adminClassId ? String(u.adminClassId) : (adminClasses.length > 0 ? String(adminClasses[0].id) : ''),
      adminClassName: u.adminClassName || '',
      faculty: u.faculty || (departments.length > 0 ? departments[0].name : ''),
      dateOfBirth: u.dateOfBirth || '',
      active: u.active !== false,
    });
    setFormErr(null);
    setShowModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.fullName.trim()) { setFormErr('Vui lòng nhập họ tên'); return; }
    if (!userForm.email.trim()) { setFormErr('Vui lòng nhập email'); return; }

    setSubmittingUser(true);
    setFormErr(null);
    try {
      const rawPassword = userForm.password.trim();
      const defaultPassword = modalMode === 'CREATE' ? (rawPassword || '123456') : (rawPassword || undefined);

      const payload: UserCreateRequest = {
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        password: defaultPassword,
        dateOfBirth: userForm.dateOfBirth || undefined,
      };

      if (userForm.role === 'STUDENT') {
        payload.studentCode = userForm.studentCode.trim() || undefined;
        if (userForm.classMode === 'EXISTING' && userForm.adminClassId) {
          payload.adminClassId = Number(userForm.adminClassId);
        } else if (userForm.classMode === 'NEW' && userForm.adminClassName.trim()) {
          payload.adminClassName = userForm.adminClassName.trim();
        }
      } else if (userForm.role === 'LECTURER') {
        payload.lecturerCode = userForm.lecturerCode.trim() || undefined;
        payload.faculty = userForm.faculty.trim() || undefined;
      }

      if (modalMode === 'CREATE') {
        await createUser(payload);
        setImportMsg(`Tạo người dùng ${payload.fullName} thành công với mật khẩu: ${defaultPassword}`);
      } else if (editingUser) {
        await updateUser(editingUser.id, payload);
        if (editingUser.active !== userForm.active) {
          await updateUserStatus(editingUser.id, userForm.active ? 'ACTIVE' : 'INACTIVE');
        }
        setImportMsg(`Cập nhật thông tin cho ${payload.fullName} thành công.`);
      }

      setShowModal(false);
      adminClassService.getAllAdminClasses().then((list) => setAdminClasses(list)).catch(() => {});
      load();
    } catch (err: unknown) {
      setFormErr((err as { message?: string })?.message ?? 'Lưu thông tin thất bại.');
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setImportMsg('Vui lòng chọn file Excel trước khi import.');
      return;
    }
    setImporting(true);
    setImportMsg(null);
    try {
      const result = await importUsersByRole(tab, selectedFile);
      setImportMsg(`Import thành công: ${result.length} tài khoản.`);
      setSelectedFile(null);
      load();
    } catch (e: unknown) {
      setImportMsg((e as { message?: string })?.message ?? 'Import thất bại.');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await exportUsersByRole(tab);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = tab === 'LECTURER' ? 'lecturers.xlsx' : 'students.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      setImportMsg((e as { message?: string })?.message ?? 'Xuất file thất bại.');
    }
  };

  const handleResetPassword = async (userItem: User) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn reset mật khẩu cho tài khoản "${userItem.fullName}" (${userItem.email})?\n\nMật khẩu sẽ được đặt lại về "123456" và người dùng sẽ phải đổi mật khẩu ở lần đăng nhập tới.`
    );
    if (!confirmed) return;

    setResettingId(userItem.id);
    try {
      await resetPassword(userItem.id);
      setImportMsg(`Reset mật khẩu thành công cho ${userItem.fullName}. Mật khẩu mặc định là 123456.`);
    } catch (e: unknown) {
      setImportMsg((e as { message?: string })?.message ?? 'Reset mật khẩu thất bại.');
    } finally {
      setResettingId(null);
    }
  };

  const handleDeleteUser = async (userItem: User) => {
    const confirmed = window.confirm(
      `Bạn có chắc chắn muốn XÓA vĩnh viễn tài khoản "${userItem.fullName}" (${userItem.email})?\n\nHành động này không thể hoàn tác.`
    );
    if (!confirmed) return;

    setDeletingId(userItem.id);
    try {
      await deleteUser(userItem.id);
      setImportMsg(`Đã xóa vĩnh viễn tài khoản ${userItem.fullName}.`);
      load();
    } catch (e: unknown) {
      setImportMsg((e as { message?: string })?.message ?? 'Xóa tài khoản thất bại.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Quản lý Người dùng' }]}
        title="Quản lý Người dùng & Tài khoản"
        subtitle="Quản lý thông tin tài khoản sinh viên, giảng viên, import Excel và phân quyền hệ thống"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4" />
              Tạo người dùng thủ công
            </Button>
          </div>
        }
      />

      {importMsg && (
        <div className={`p-4 rounded-xl border text-xs font-medium flex items-center gap-2 ${
          importMsg.includes('thành công') 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' 
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {importMsg.includes('thành công') ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {importMsg}
        </div>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => { setTab('STUDENT'); setSelectedClass(''); setPage(0); }}
                className={`px-3 py-1.5 rounded-md transition ${tab === 'STUDENT' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Sinh viên
              </button>
              <button
                onClick={() => { setTab('LECTURER'); setSelectedClass(''); setPage(0); }}
                className={`px-3 py-1.5 rounded-md transition ${tab === 'LECTURER' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
              >
                Giảng viên
              </button>
            </div>

            {tab === 'STUDENT' && adminClasses.length > 0 && (
              <Select
                value={selectedClass}
                onChange={(e) => { setSelectedClass(e.target.value); setPage(0); }}
                options={[
                  { label: '-- Tất cả lớp hành chính --', value: '' },
                  ...adminClasses.map(ac => ({ label: ac.className, value: ac.className }))
                ]}
              />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Tìm theo tên / email…"
                value={kw}
                onChange={(e) => { setKw(e.target.value); setPage(0); }}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>

            <label className="cursor-pointer">
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
              <span className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 transition">
                <Upload className="w-3.5 h-3.5" />
                {selectedFile ? selectedFile.name : 'Chọn file Excel'}
              </span>
            </label>

            <Button variant="secondary" size="sm" onClick={handleImport} disabled={importing || !selectedFile}>
              {importing ? 'Đang import…' : 'Import'}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center"><Spinner /></div>
        ) : users.length === 0 ? (
          <Empty msg="Không có kết quả người dùng phù hợp" />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">{tab === 'STUDENT' ? 'Mã SV' : 'Mã GV'}</th>
                    <th className="py-3 px-4">Họ và Tên</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">{tab === 'STUDENT' ? 'Lớp hành chính' : 'Khoa / Bộ môn'}</th>
                    {tab === 'LECTURER' && <th className="py-3 px-4">Chức vụ / GVCN</th>}
                    <th className="py-3 px-4 text-center">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {users.map((u, i) => (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">{page * pageSize + i + 1}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-navy-900 dark:text-navy-300">{u.studentCode || u.lecturerCode || '-'}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">{u.fullName}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{u.email}</td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        {tab === 'STUDENT' ? (
                          u.adminClassName ? <Badge variant="info">{u.adminClassName}</Badge> : '-'
                        ) : (
                          u.faculty || '-'
                        )}
                      </td>
                      {tab === 'LECTURER' && (
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                          {u.adminClassName ? (
                            <Badge variant="purple">GVCN: {u.adminClassName}</Badge>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">GV Bộ môn</span>
                          )}
                        </td>
                      )}
                      <td className="py-3 px-4 text-center">
                        <Badge variant={u.active !== false ? 'success' : 'danger'}>
                          {u.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-1.5">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(u)}>
                          <Edit3 className="w-3.5 h-3.5" /> Sửa
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleResetPassword(u)} disabled={resettingId === u.id}>
                          <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> {resettingId === u.id ? 'Resetting...' : 'Reset MK'}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDeleteUser(u)} disabled={deletingId === u.id}>
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" /> {deletingId === u.id ? 'Deleting...' : 'Xóa'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{users.length > 0 ? page * pageSize + 1 : 0}</span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min((page + 1) * pageSize, totalElements)}</span> trên tổng số <span className="font-semibold text-slate-800 dark:text-slate-200">{totalElements}</span> người dùng
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  options={[
                    { label: '10 dòng / trang', value: '10' },
                    { label: '20 dòng / trang', value: '20' },
                    { label: '50 dòng / trang', value: '50' },
                    { label: '100 dòng / trang', value: '100' },
                  ]}
                />

                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  &laquo; Trước
                </Button>

                <span className="text-slate-600 dark:text-slate-400 font-medium px-1">
                  Trang {page + 1} / {Math.max(1, totalPages)}
                </span>

                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Sau &raquo;
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Tạo / Chỉnh sửa người dùng */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={modalMode === 'CREATE' ? 'Tạo người dùng mới' : 'Chỉnh sửa người dùng'}
      >
        {formErr && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {formErr}
          </div>
        )}

        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {modalMode === 'CREATE' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vai trò
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="userRole"
                    value="STUDENT"
                    checked={userForm.role === 'STUDENT'}
                    onChange={() => setUserForm({ ...userForm, role: 'STUDENT' })}
                  />
                  Sinh viên
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer text-slate-700 dark:text-slate-300 font-medium">
                  <input
                    type="radio"
                    name="userRole"
                    value="LECTURER"
                    checked={userForm.role === 'LECTURER'}
                    onChange={() => setUserForm({ ...userForm, role: 'LECTURER' })}
                  />
                  Giảng viên
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Họ và tên <span className="text-rose-500">*</span>
            </label>
            <Input
              required
              value={userForm.fullName}
              onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
              placeholder="Nhập họ và tên"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email <span className="text-rose-500">*</span>
            </label>
            <Input
              type="email"
              required
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              placeholder="Nhập địa chỉ email"
            />
          </div>

          {modalMode === 'CREATE' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mật khẩu <span className="text-slate-400 font-normal">(Mặc định: 123456)</span>
              </label>
              <Input
                type="password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                placeholder="Bỏ trống để dùng mật khẩu mặc định"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {userForm.role === 'STUDENT' ? 'Mã sinh viên' : 'Mã giảng viên'}
              </label>
              <Input
                value={userForm.role === 'STUDENT' ? userForm.studentCode : userForm.lecturerCode}
                onChange={(e) => setUserForm({
                  ...userForm,
                  [userForm.role === 'STUDENT' ? 'studentCode' : 'lecturerCode']: e.target.value
                })}
                placeholder={userForm.role === 'STUDENT' ? 'SV001' : 'GV001'}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Ngày sinh
              </label>
              <Input
                type="date"
                value={userForm.dateOfBirth}
                onChange={(e) => setUserForm({ ...userForm, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          {userForm.role === 'STUDENT' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-2">
                Lớp hành chính
              </label>
              <div className="flex gap-4 mb-2.5">
                <label className="inline-flex items-center gap-1.5 font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="classMode"
                    value="EXISTING"
                    checked={userForm.classMode === 'EXISTING'}
                    onChange={() => setUserForm({ ...userForm, classMode: 'EXISTING' })}
                  />
                  Lớp đã có
                </label>
                <label className="inline-flex items-center gap-1.5 font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                  <input
                    type="radio"
                    name="classMode"
                    value="NEW"
                    checked={userForm.classMode === 'NEW'}
                    onChange={() => setUserForm({ ...userForm, classMode: 'NEW' })}
                  />
                  + Tạo lớp mới
                </label>
              </div>

              {userForm.classMode === 'EXISTING' ? (
                <Select
                  value={userForm.adminClassId}
                  onChange={(e) => setUserForm({ ...userForm, adminClassId: e.target.value })}
                  options={[
                    { label: '-- Chọn lớp hành chính --', value: '' },
                    ...adminClasses.map(ac => ({ label: `${ac.className} (ID: ${ac.id})`, value: String(ac.id) }))
                  ]}
                />
              ) : (
                <Input
                  value={userForm.adminClassName}
                  onChange={(e) => setUserForm({ ...userForm, adminClassName: e.target.value })}
                  placeholder="Nhập tên lớp mới (Ví dụ: 62PM1, CNTT1-K62)"
                />
              )}
            </div>
          )}

          {userForm.role === 'LECTURER' && (
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Khoa / Bộ môn
              </label>
              {departments.length > 0 ? (
                <Select
                  value={userForm.faculty}
                  onChange={(e) => setUserForm({ ...userForm, faculty: e.target.value })}
                  options={[
                    { label: '-- Chọn Khoa / Bộ môn --', value: '' },
                    ...departments.map(dep => ({ label: dep.name, value: dep.name }))
                  ]}
                />
              ) : (
                <Input
                  value={userForm.faculty}
                  onChange={(e) => setUserForm({ ...userForm, faculty: e.target.value })}
                  placeholder="Ví dụ: Công nghệ thông tin"
                />
              )}
            </div>
          )}

          {modalMode === 'EDIT' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="userActiveCheck"
                checked={userForm.active}
                onChange={(e) => setUserForm({ ...userForm, active: e.target.checked })}
                className="rounded border-slate-300 text-accent-600 focus:ring-accent-500"
              />
              <label htmlFor="userActiveCheck" className="font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                Hoạt động (Active)
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={submittingUser}>
              {submittingUser ? 'Đang lưu...' : (modalMode === 'CREATE' ? 'Tạo mới' : 'Cập nhật')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ==========================================================================
   3. ADMIN CLASSES
   ========================================================================== */
export function AdminClasses() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [courses, setCourses] = useState<import('../../types').Course[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingClazz, setEditingClazz] = useState<Clazz | null>(null);
  const [editForm, setEditForm] = useState({
    classCode: '',
    className: '',
    courseId: '',
    lecturerId: '',
    maxStudents: '50',
    semester: 'HK1',
    academicYear: '2026-2027',
  });
  const [form, setForm] = useState({
    classCode: '',
    className: '',
    courseId: '',
    lecturerId: '',
    maxStudents: '50',
    semester: 'HK1',
    academicYear: '2026-2027',
  });

  // Schedule Modal State
  const [scheduleClazz, setScheduleClazz] = useState<Clazz | null>(null);
  const [classSchedules, setClassSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 1,
    startPeriod: 1,
    endPeriod: 3,
    room: '',
  });
  const [scheduleErr, setScheduleErr] = useState<string | null>(null);
  const [savingSchedule, setSavingSchedule] = useState(false);

  // Search, Filter & Pagination State
  const [searchKw, setSearchKw] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const filteredClasses = classes.filter((c) => {
    const matchesSearch = !searchKw.trim() ||
      c.classCode.toLowerCase().includes(searchKw.toLowerCase()) ||
      c.className.toLowerCase().includes(searchKw.toLowerCase()) ||
      (c.courseTitle && c.courseTitle.toLowerCase().includes(searchKw.toLowerCase())) ||
      (c.lecturerName && c.lecturerName.toLowerCase().includes(searchKw.toLowerCase()));
    const matchesCourse = !selectedCourseFilter || String(c.courseId) === selectedCourseFilter;
    return matchesSearch && matchesCourse;
  });

  const totalPages = Math.ceil(filteredClasses.length / pageSize) || 1;
  const paginatedClasses = filteredClasses.slice(page * pageSize, (page + 1) * pageSize);

  const loadData = useCallback(() => {
    let mounted = true;
    Promise.all([
      clazzService.getAllClasses(),
      import('../../services/curriculumService').then((m) => m.getAllCourses()),
      adminService.listLecturers(''),
    ])
      .then(([classList, courseList, lecturerList]) => {
        if (!mounted) return;
        setClasses(classList);
        setCourses(courseList);
        setLecturers(lecturerList);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setErr((e as { message?: string })?.message ?? 'Lỗi tải danh sách lớp');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const openEdit = (c: Clazz) => {
    setEditingClazz(c);
    setShowForm(false);
    setEditForm({
      classCode: c.classCode,
      className: c.className,
      courseId: String(c.courseId || ''),
      lecturerId: c.lecturerId ? String(c.lecturerId) : '',
      maxStudents: String(c.maxStudents ?? 50),
      semester: c.semester || 'HK1',
      academicYear: c.academicYear || '2026-2027',
    });
  };

  const handleUpdate = async () => {
    if (!editingClazz) return;
    if (!editForm.classCode.trim()) { setErr('Vui lòng nhập mã lớp học phần'); return; }
    if (!editForm.className.trim()) { setErr('Vui lòng nhập tên lớp học phần'); return; }

    const maxStuds = Number(editForm.maxStudents);
    if (!Number.isFinite(maxStuds) || maxStuds <= 0) {
      setErr('Sĩ số tối đa phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      await clazzService.updateClazz(editingClazz.id, {
        classCode: editForm.classCode.trim(),
        className: editForm.className.trim(),
        courseId: editForm.courseId ? Number(editForm.courseId) : editingClazz.courseId,
        lecturerId: editForm.lecturerId ? Number(editForm.lecturerId) : null,
        maxStudents: maxStuds,
        semester: editForm.semester,
        academicYear: editForm.academicYear,
      });
      setEditingClazz(null);
      loadData();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Cập nhật lớp học phần thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreate = async () => {
    if (!form.classCode.trim()) { setErr('Vui lòng nhập mã lớp học phần'); return; }
    if (!form.className.trim()) { setErr('Vui lòng nhập tên lớp học phần'); return; }
    if (!form.courseId) { setErr('Vui lòng chọn môn học'); return; }

    const maxStuds = Number(form.maxStudents);
    if (!Number.isFinite(maxStuds) || maxStuds <= 0) {
      setErr('Sĩ số tối đa phải lớn hơn 0');
      return;
    }

    setSubmitting(true);
    setErr(null);
    try {
      await clazzService.createClazz({
        classCode: form.classCode.trim(),
        className: form.className.trim(),
        courseId: Number(form.courseId),
        courseTitle: null,
        lecturerId: form.lecturerId ? Number(form.lecturerId) : null,
        lecturerName: null,
        maxStudents: maxStuds,
        semester: form.semester,
        academicYear: form.academicYear,
        createdAt: new Date().toISOString(),
      });
      setShowForm(false);
      setForm({
        classCode: '',
        className: '',
        courseId: '',
        lecturerId: '',
        maxStudents: '50',
        semester: 'HK1',
        academicYear: '2026-2027',
      });
      loadData();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Tạo lớp học phần thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lớp học phần này?')) return;
    try {
      await clazzService.deleteClazz(id);
      setClasses((prev) => prev.filter((c) => c.id !== id));
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể xóa lớp (có thể đã có SV đăng ký)');
    }
  };

  const openScheduleModal = async (c: Clazz) => {
    setScheduleClazz(c);
    setScheduleErr(null);
    setLoadingSchedules(true);
    try {
      const list = await scheduleService.getClazzSchedule(c.id);
      setClassSchedules(list);
    } catch (e: unknown) {
      setScheduleErr((e as { message?: string })?.message ?? 'Không thể tải lịch học');
    } finally {
      setLoadingSchedules(false);
    }
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleClazz) return;
    if (scheduleForm.startPeriod > scheduleForm.endPeriod) {
      setScheduleErr('Tiết bắt đầu phải nhỏ hơn hoặc bằng tiết kết thúc');
      return;
    }
    setSavingSchedule(true);
    setScheduleErr(null);
    try {
      await scheduleService.createSchedule(scheduleClazz.id, {
        dayOfWeek: Number(scheduleForm.dayOfWeek),
        startPeriod: Number(scheduleForm.startPeriod),
        endPeriod: Number(scheduleForm.endPeriod),
        room: scheduleForm.room.trim() || undefined,
      });
      const list = await scheduleService.getClazzSchedule(scheduleClazz.id);
      setClassSchedules(list);
      setScheduleForm({ dayOfWeek: 1, startPeriod: 1, endPeriod: 3, room: '' });
    } catch (e: unknown) {
      setScheduleErr((e as { message?: string })?.message ?? 'Thêm lịch học thất bại (xung đột phòng học hoặc thời gian)');
    } finally {
      setSavingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: number) => {
    if (!scheduleClazz) return;
    try {
      await scheduleService.deleteSchedule(scheduleId);
      setClassSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (e: unknown) {
      setScheduleErr((e as { message?: string })?.message ?? 'Xóa lịch học thất bại');
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Quản lý Lớp học phần' }]}
        title="Quản lý Lớp học phần"
        subtitle="Tạo và phân công giảng viên, đặt sĩ số giới hạn và xếp thời khóa biểu cho các Lớp học phần"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            {showForm ? 'Hủy bỏ' : 'Tạo Lớp học phần mới'}
          </Button>
        }
      />

      {err && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {err}
        </div>
      )}

      {/* Editing Box */}
      {editingClazz && (
        <Card className="border-2 border-navy-300 dark:border-navy-700 bg-navy-50/20 dark:bg-navy-950/20">
          <div className="flex items-center justify-between mb-4 border-b border-navy-100 dark:border-navy-800 pb-2">
            <h3 className="font-bold text-navy-900 dark:text-navy-200 text-sm">
              Chỉnh sửa & Phân công Giảng viên: <span className="font-mono">{editingClazz.classCode}</span>
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setEditingClazz(null)}>Hủy</Button>
          </div>
          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã lớp học phần *</label>
              <Input
                value={editForm.classCode}
                onChange={(e) => setEditForm({ ...editForm, classCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên lớp học phần *</label>
              <Input
                value={editForm.className}
                onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Môn học</label>
              <Select
                value={editForm.courseId}
                onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                options={[
                  { label: '-- Chọn môn học --', value: '' },
                  ...courses.map(c => ({ label: `[${c.code}] ${c.title} (${c.credit} TC)`, value: String(c.id) }))
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giảng viên phụ trách</label>
              <Select
                value={editForm.lecturerId}
                onChange={(e) => setEditForm({ ...editForm, lecturerId: e.target.value })}
                options={[
                  { label: '-- Chưa phân công --', value: '' },
                  ...lecturers.map(l => ({ label: `${l.fullName} (${l.email})`, value: String(l.id) }))
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sĩ số tối đa *</label>
              <Input
                type="number"
                min="1"
                value={editForm.maxStudents}
                onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Học kỳ</label>
                <Input
                  value={editForm.semester}
                  onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Năm học</label>
                <Input
                  value={editForm.academicYear}
                  onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setEditingClazz(null)}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={() => void handleUpdate()} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </Card>
      )}

      {/* Creation Box */}
      {showForm && (
        <Card className="border border-navy-200 dark:border-navy-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Tạo Lớp học phần mới cho sinh viên đăng ký</h3>
          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã lớp học phần *</label>
              <Input
                placeholder="VD: INT3306_01"
                value={form.classCode}
                onChange={(e) => setForm({ ...form, classCode: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên lớp học phần *</label>
              <Input
                placeholder="VD: Lập trình Mạng - Nhóm 1"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Môn học *</label>
              <Select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                options={[
                  { label: '-- Chọn môn học --', value: '' },
                  ...courses.map(c => ({ label: `[${c.code}] ${c.title} (${c.credit} TC)`, value: String(c.id) }))
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giảng viên phụ trách</label>
              <Select
                value={form.lecturerId}
                onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                options={[
                  { label: '-- Chọn giảng viên --', value: '' },
                  ...lecturers.map(l => ({ label: `${l.fullName} (${l.email})`, value: String(l.id) }))
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Sĩ số tối đa *</label>
              <Input
                type="number"
                min="1"
                placeholder="VD: 50"
                value={form.maxStudents}
                onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Học kỳ</label>
                <Input
                  placeholder="HK1"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Năm học</label>
                <Input
                  placeholder="2026-2027"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={() => void handleCreate()} disabled={submitting}>
              {submitting ? 'Đang tạo...' : 'Tạo Lớp học phần'}
            </Button>
          </div>
        </Card>
      )}

      {/* Main Table Card */}
      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-full md:w-80">
            <Input
              placeholder="Tìm theo Mã lớp, Tên lớp, Giảng viên..."
              value={searchKw}
              onChange={(e) => { setSearchKw(e.target.value); setPage(0); }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="w-full md:w-64">
            <Select
              value={selectedCourseFilter}
              onChange={(e) => { setSelectedCourseFilter(e.target.value); setPage(0); }}
              options={[
                { label: '-- Tất cả môn học --', value: '' },
                ...courses.map(c => ({ label: `[${c.code}] ${c.title}`, value: String(c.id) }))
              ]}
            />
          </div>
        </div>

        {filteredClasses.length === 0 ? (
          <Empty msg="Không tìm thấy lớp học phần nào" />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Mã lớp HP</th>
                    <th className="py-3.5 px-4">Tên lớp HP</th>
                    <th className="py-3.5 px-4">Môn học</th>
                    <th className="py-3.5 px-4">Giảng viên</th>
                    <th className="py-3.5 px-4 text-center">Sĩ số tối đa</th>
                    <th className="py-3.5 px-4 text-center">Học kỳ</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {paginatedClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-navy-900 dark:text-navy-300">{c.classCode}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <Link to={`/admin/classes/${c.id}`} className="hover:underline text-navy-700 dark:text-navy-300">{c.className}</Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{c.courseTitle || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {c.lecturerName ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.lecturerName}</span>
                        ) : (
                          <span className="italic text-amber-600 dark:text-amber-400">Chưa phân công</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="info">{c.currentStudents ?? 0}/{c.maxStudents ?? '∞'}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success">{c.semester} · {c.academicYear}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c)}>
                          <Edit3 className="w-3.5 h-3.5" /> Sửa
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void openScheduleModal(c)}>
                          <Calendar className="w-3.5 h-3.5 text-navy-700 dark:text-navy-300" /> Xếp lịch
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDelete(c.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-200 dark:border-slate-800 text-xs">
              <div className="text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredClasses.length > 0 ? page * pageSize + 1 : 0}</span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min((page + 1) * pageSize, filteredClasses.length)}</span> trên tổng số <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredClasses.length}</span> lớp
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  options={[
                    { label: '10 dòng / trang', value: '10' },
                    { label: '20 dòng / trang', value: '20' },
                    { label: '50 dòng / trang', value: '50' },
                  ]}
                />

                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  &laquo; Trước
                </Button>

                <span className="text-slate-600 dark:text-slate-400 font-medium px-1">
                  Trang {page + 1} / {totalPages}
                </span>

                <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}>
                  Sau &raquo;
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Xếp lịch giảng dạy & Phòng học */}
      <Modal
        isOpen={!!scheduleClazz}
        onClose={() => setScheduleClazz(null)}
        title={`Xếp lịch giảng dạy: ${scheduleClazz?.classCode || ''}`}
      >
        {scheduleErr && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {scheduleErr}
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div>
            <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider text-[11px]">
              Danh sách ca học đã xếp ({classSchedules.length})
            </h4>
            {loadingSchedules ? (
              <Spinner />
            ) : classSchedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-slate-400 dark:border-slate-800">
                Chưa có lịch giảng dạy nào được xếp cho lớp học phần này.
              </div>
            ) : (
              <div className="space-y-2">
                {classSchedules.map((s) => {
                  const dayLabel = DAY_NAMES[s.dayOfWeek ?? 1] || `Thứ ${s.dayOfWeek}`;
                  const startInfo = PERIOD_TIMES[s.startPeriod ?? 1]?.start || '06:45';
                  const endInfo = PERIOD_TIMES[s.endPeriod ?? 3]?.end || '09:25';
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="info">{dayLabel}</Badge>
                        <span className="font-semibold text-slate-700 dark:text-slate-200">
                          Tiết {s.startPeriod} - {s.endPeriod} ({startInfo} - {endInfo})
                        </span>
                        <Badge variant="warning">
                          <Building2 className="w-3 h-3 mr-1" /> {s.room || 'Chưa xếp'}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => void handleDeleteSchedule(s.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <form onSubmit={handleAddSchedule} className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">
              + Thêm lịch / ca học mới
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Thứ</label>
                <Select
                  value={scheduleForm.dayOfWeek}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
                  options={Object.entries(DAY_NAMES).map(([val, name]) => ({ label: name, value: val }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tiết BĐ</label>
                <Select
                  value={scheduleForm.startPeriod}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, startPeriod: Number(e.target.value) })}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(p => ({ label: `Tiết ${p} (${PERIOD_TIMES[p]?.start})`, value: String(p) }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tiết KT</label>
                <Select
                  value={scheduleForm.endPeriod}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, endPeriod: Number(e.target.value) })}
                  options={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(p => ({ label: `Tiết ${p} (${PERIOD_TIMES[p]?.end})`, value: String(p) }))}
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Phòng học</label>
                <Input
                  placeholder="VD: A2-301"
                  value={scheduleForm.room}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setScheduleClazz(null)}>
                Đóng
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={savingSchedule}>
                {savingSchedule ? 'Đang lưu...' : '+ Thêm ca học'}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}