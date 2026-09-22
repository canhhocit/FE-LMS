import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Users, BookOpen, ClipboardList, Calendar, Key, Building2, Zap } from 'lucide-react';
import * as clazzService from '../../services/clazzService';
import * as adminService from '../../services/adminService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import { importUsersByRole, exportUsersByRole, resetPassword, createUser, updateUser, updateUserStatus, type UserCreateRequest } from '../../services/userService';
import * as adminClassService from '../../services/adminClassService';
import type { AdminClassResponse } from '../../services/adminClassService';
import { getDepartments, type DepartmentResponse } from '../../services/departmentService';
import * as scheduleService from '../../services/scheduleService';
import type { Clazz, User, DashboardStats, Schedule } from '../../types';

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

  const metricCards = [
    { label: 'Tổng người dùng', val: stats.totalUsers, Icon: Users, color: 'border-l-4 border-indigo-500 text-indigo-600 dark:text-indigo-400' },
    { label: 'Lớp môn học', val: stats.totalClasses, Icon: BookOpen, color: 'border-l-4 border-emerald-500 text-emerald-600 dark:text-emerald-400' },
    { label: 'Lượt đăng ký học', val: stats.totalEnrollments, Icon: ClipboardList, color: 'border-l-4 border-amber-500 text-amber-600 dark:text-amber-400' },
  ];

  const quickActions = [
    { title: 'Xếp lịch giảng dạy', desc: 'Phân ca, phòng học & lịch học phần', link: '/admin/classes', Icon: Calendar, badge: 'Admin/Manager' },
    { title: 'Phân quyền Manager & PBAC', desc: 'Duyệt quyền quản trị viên & cấp quyền', link: '/admin/pbac-approvals', Icon: Key, badge: 'Super Admin' },
    { title: 'Quản lý Lớp hành chính', desc: 'Gán GVCN, quản lý danh sách sinh viên', link: '/admin/administrative-classes', Icon: Building2, badge: 'Quản lý' },
    { title: 'Đợt Đăng ký Học tập', desc: 'Mở/khóa đợt đăng ký môn học phần', link: '/admin/registration', Icon: ClipboardList, badge: 'Đợt mới' },
    { title: 'Người dùng & Tài khoản', desc: 'Tạo tài khoản, import Excel, reset MK', link: '/admin/users', Icon: Users, badge: 'Tài khoản' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <PageTitle>Dashboard Quản Trị Hệ Thống</PageTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
            Học kỳ hiện tại: <span className="font-bold text-indigo-600 dark:text-indigo-400">HK1 (2026-2027)</span> • Hệ thống LMS LearningHub
          </p>
        </div>
      </div>

      {/* Main Metric Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metricCards.map((i) => {
          const IconComp = i.Icon;
          return (
            <Card key={i.label} className={`p-4 transition hover:shadow-md ${i.color}`}>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>{i.label}</span>
                <IconComp className="w-5 h-5 opacity-80" />
              </div>
              <div className="text-2xl font-black mt-2">{i.val.toLocaleString()}</div>
            </Card>
          );
        })}
      </div>

      {/* Quick Access Management Actions */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
          Phím Tắt & Tác Vụ Quản Trị Nhanh
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((act) => {
            const IconComp = act.Icon;
            return (
              <Link key={act.title} to={act.link}>
                <Card className="h-full hover:border-indigo-300 dark:hover:border-indigo-700 transition cursor-pointer group p-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 group-hover:scale-110 transition">
                      <IconComp className="w-6 h-6" />
                    </div>
                    <Pill color="indigo">{act.badge}</Pill>
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm mt-3 group-hover:text-indigo-600 transition">
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
      const payload: UserCreateRequest = {
        fullName: userForm.fullName.trim(),
        email: userForm.email.trim(),
        role: userForm.role,
        password: userForm.password || undefined,
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
        setImportMsg(`Tạo người dùng ${payload.fullName} thành công.`);
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
      setImportMsg(`Reset mật khẩu thành công cho ${userItem.fullName}. Mật khẩu mặc định là 123456 (Bắt buộc đổi khi đăng nhập lại).`);
    } catch (e: unknown) {
      setImportMsg((e as { message?: string })?.message ?? 'Reset mật khẩu thất bại.');
    } finally {
      setResettingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!selectedClass) return true;
    return u.adminClassName === selectedClass || String(u.adminClassId) === selectedClass;
  });

  return (
    <div>
      <PageTitle>Người dùng</PageTitle>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {(['STUDENT', 'LECTURER'] as const).map((t) => (
          <button key={t} onClick={() => { setTab(t); setSelectedClass(''); setPage(0); }}
            className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {t === 'STUDENT' ? 'Sinh viên' : 'Giảng viên'}
          </button>
        ))}

        {tab === 'STUDENT' && adminClasses.length > 0 && (
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setPage(0); }}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-700 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">-- Tất cả lớp hành chính --</option>
            {adminClasses.map((ac) => (
              <option key={ac.id} value={ac.className}>
                {ac.className}
              </option>
            ))}
          </select>
        )}

        <input value={kw} onChange={(e) => { setKw(e.target.value); setPage(0); }} placeholder="Tìm theo tên/email…"
          className="ml-auto min-w-55 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-700" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tạo người dùng thủ công
        </button>

        <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <label className="inline-flex items-center gap-2 rounded border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:border-indigo-300">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          {selectedFile ? selectedFile.name : 'Chọn file Excel'}
        </label>
        <button onClick={handleImport} disabled={importing || !selectedFile}
          className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500">
          {importing ? 'Đang import…' : 'Import file'}
        </button>
        <button onClick={handleExport}
          className="px-3 py-2 rounded text-sm bg-slate-200 text-slate-700 hover:bg-slate-300">
          Xuất Excel
        </button>
      </div>

      {importMsg && (
        <div className={`mb-3 rounded border px-3 py-2 text-sm ${importMsg.includes('thành công') ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
          {importMsg}
        </div>
      )}

      <Card>
        {loading ? <Spinner /> : users.length === 0 ? <Empty msg="Không có kết quả" /> : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="text-left p-3">#</th>
                    <th className="text-left p-3">{tab === 'STUDENT' ? 'Mã SV' : 'Mã GV'}</th>
                    <th className="text-left p-3">Họ tên</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">{tab === 'STUDENT' ? 'Lớp hành chính' : 'Khoa / Bộ môn'}</th>
                    {tab === 'LECTURER' && <th className="text-left p-3">Chức vụ / GVCN</th>}
                    <th className="text-center p-3">Trạng thái</th>
                    <th className="text-center p-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, i) => (
                    <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                      <td className="p-3 text-slate-500">{page * pageSize + i + 1}</td>
                      <td className="p-3 font-mono text-xs text-indigo-600 font-semibold">{u.studentCode || u.lecturerCode || '-'}</td>
                      <td className="p-3 font-medium text-slate-800">{u.fullName}</td>
                      <td className="p-3 text-slate-500">{u.email}</td>
                      <td className="p-3 text-slate-600 font-medium">
                        {tab === 'STUDENT' ? (
                          u.adminClassName ? <Pill color="indigo">{u.adminClassName}</Pill> : '-'
                        ) : (
                          u.faculty || '-'
                        )}
                      </td>
                      {tab === 'LECTURER' && (
                        <td className="p-3 text-slate-600 font-medium">
                          {u.adminClassName ? (
                            <Pill color="purple">GVCN: {u.adminClassName}</Pill>
                          ) : (
                            <span className="text-xs text-slate-400 font-semibold">GVBM</span>
                          )}
                        </td>
                      )}
                      <td className="p-3 text-center"><Pill color={u.active !== false ? 'green' : 'red'}>{u.active !== false ? 'Active' : 'Inactive'}</Pill></td>
                      <td className="p-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleResetPassword(u)}
                            disabled={resettingId === u.id}
                            className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50 transition"
                          >
                            {resettingId === u.id ? 'Đang reset...' : 'Reset MK'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-3 mt-3 px-2">
              <div className="text-xs text-slate-500">
                Hiển thị <span className="font-semibold text-slate-700">{users.length > 0 ? page * pageSize + 1 : 0}</span> - <span className="font-semibold text-slate-700">{Math.min((page + 1) * pageSize, totalElements)}</span> trên tổng số <span className="font-semibold text-slate-700">{totalElements}</span> người dùng
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 font-medium"
                >
                  <option value={10}>10 dòng / trang</option>
                  <option value={20}>20 dòng / trang</option>
                  <option value={50}>50 dòng / trang</option>
                  <option value={100}>100 dòng / trang</option>
                </select>

                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  &laquo; Trước
                </button>

                <span className="text-xs text-slate-600 font-medium px-1">
                  Trang {page + 1} / {Math.max(1, totalPages)}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  Sau &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Tạo / Chỉnh sửa người dùng */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                {modalMode === 'CREATE' ? 'Tạo người dùng mới' : 'Chỉnh sửa người dùng'}
              </h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {formErr && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {formErr}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="mt-4 space-y-4">
              {modalMode === 'CREATE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Vai trò
                  </label>
                  <div className="flex gap-4">
                    <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="userRole"
                        value="STUDENT"
                        checked={userForm.role === 'STUDENT'}
                        onChange={() => setUserForm({ ...userForm, role: 'STUDENT' })}
                      />
                      Sinh viên
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-sm cursor-pointer text-slate-700 dark:text-slate-300">
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={userForm.fullName}
                  onChange={(e) => setUserForm({ ...userForm, fullName: e.target.value })}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Ví dụ: sv.nguyenvana@learninghub.edu.vn"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                />
              </div>

              {modalMode === 'CREATE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu <span className="text-slate-400 font-normal">(Mặc định: 123456)</span>
                  </label>
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="Bỏ trống để dùng mật khẩu mặc định"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {userForm.role === 'STUDENT' ? 'Mã sinh viên' : 'Mã giảng viên'}
                  </label>
                  <input
                    type="text"
                    value={userForm.role === 'STUDENT' ? userForm.studentCode : userForm.lecturerCode}
                    onChange={(e) => setUserForm({
                      ...userForm,
                      [userForm.role === 'STUDENT' ? 'studentCode' : 'lecturerCode']: e.target.value
                    })}
                    placeholder={userForm.role === 'STUDENT' ? 'SV001' : 'GV001'}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={userForm.dateOfBirth}
                    onChange={(e) => setUserForm({ ...userForm, dateOfBirth: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  />
                </div>
              </div>

              {userForm.role === 'STUDENT' && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 dark:border-slate-700 dark:bg-slate-800/40">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
                    Lớp hành chính
                  </label>
                  <div className="flex gap-4 mb-2.5">
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                      <input
                        type="radio"
                        name="classMode"
                        value="EXISTING"
                        checked={userForm.classMode === 'EXISTING'}
                        onChange={() => setUserForm({ ...userForm, classMode: 'EXISTING' })}
                      />
                      Lớp đã có
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
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
                    <select
                      value={userForm.adminClassId}
                      onChange={(e) => setUserForm({ ...userForm, adminClassId: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">-- Chọn lớp hành chính --</option>
                      {adminClasses.map((ac) => (
                        <option key={ac.id} value={ac.id}>
                          {ac.className} (ID: {ac.id})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={userForm.adminClassName}
                      onChange={(e) => setUserForm({ ...userForm, adminClassName: e.target.value })}
                      placeholder="Nhập tên lớp mới (Ví dụ: 62PM1, CNTT1-K62)"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    />
                  )}
                </div>
              )}

              {userForm.role === 'LECTURER' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Khoa / Bộ môn
                  </label>
                  {departments.length > 0 ? (
                    <select
                      value={userForm.faculty}
                      onChange={(e) => setUserForm({ ...userForm, faculty: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                    >
                      <option value="">-- Chọn Khoa / Bộ môn --</option>
                      {departments.map((dep) => (
                        <option key={dep.id} value={dep.name}>
                          {dep.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={userForm.faculty}
                      onChange={(e) => setUserForm({ ...userForm, faculty: e.target.value })}
                      placeholder="Ví dụ: Công nghệ thông tin"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
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
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="userActiveCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Hoạt động (Active)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {submittingUser ? 'Đang lưu...' : (modalMode === 'CREATE' ? 'Tạo mới' : 'Cập nhật')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

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
      clazzService.getMyClasses(),
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
    <div className="space-y-4">
      <PageTitle>Quản lý Lớp học phần</PageTitle>
      
      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex justify-between items-center">
          <span>{err}</span>
          <button onClick={() => setErr(null)} className="text-xs font-semibold cursor-pointer">Đóng</button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-500 font-medium">Tạo và phân công giảng viên, đặt sĩ số giới hạn cho các Lớp học phần</div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm cursor-pointer"
        >
          {showForm ? 'Hủy bỏ' : '+ Tạo Lớp học phần mới'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-neutral-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <input
            type="text"
            value={searchKw}
            onChange={(e) => { setSearchKw(e.target.value); setPage(0); }}
            placeholder="Tìm theo Mã lớp, Tên lớp, Giảng viên, Môn học..."
            className="w-full px-3.5 py-1.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedCourseFilter}
            onChange={(e) => { setSelectedCourseFilter(e.target.value); setPage(0); }}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="">-- Tất cả môn học --</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                [{c.code}] {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {editingClazz && (
        <Card className="mb-6 border-2 border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200">
              Chỉnh sửa & Phân công Giảng viên cho lớp: <span className="font-mono text-indigo-700 dark:text-indigo-300">{editingClazz.classCode}</span>
            </h3>
            <button onClick={() => setEditingClazz(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer">Hủy</button>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mã lớp học phần *</label>
              <input
                value={editForm.classCode}
                onChange={(e) => setEditForm({ ...editForm, classCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên lớp học phần *</label>
              <input
                value={editForm.className}
                onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Môn học (Khóa học)</label>
              <select
                value={editForm.courseId}
                onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-xs"
              >
                <option value="">-- Chọn môn học --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title} ({c.credit} tín chỉ)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Giảng viên phụ trách</label>
              <select
                value={editForm.lecturerId}
                onChange={(e) => setEditForm({ ...editForm, lecturerId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700 text-xs"
              >
                <option value="">-- Chưa phân công --</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sĩ số tối đa *</label>
              <input
                type="number"
                min="1"
                value={editForm.maxStudents}
                onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-indigo-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Học kỳ</label>
                <input
                  value={editForm.semester}
                  onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Năm học</label>
                <input
                  value={editForm.academicYear}
                  onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={() => setEditingClazz(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer">Hủy</button>
            <button onClick={() => void handleUpdate()} disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 cursor-pointer">
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6 border-2 border-indigo-100">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3 text-sm">Tạo Lớp học phần mới cho sinh viên đăng ký</h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mã lớp học phần *</label>
              <input
                placeholder="VD: INT3306_01"
                value={form.classCode}
                onChange={(e) => setForm({ ...form, classCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên lớp học phần *</label>
              <input
                placeholder="VD: Lập trình Mạng - Nhóm 1"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Môn học (Khóa học) *</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="">-- Chọn môn học --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.code}] {c.title} ({c.credit} tín chỉ)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Giảng viên phụ trách</label>
              <select
                value={form.lecturerId}
                onChange={(e) => setForm({ ...form, lecturerId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
              >
                <option value="">-- Chọn giảng viên --</option>
                {lecturers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.fullName} ({l.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Sĩ số tối đa (Giới hạn SV) *</label>
              <input
                type="number"
                min="1"
                placeholder="VD: 50"
                value={form.maxStudents}
                onChange={(e) => setForm({ ...form, maxStudents: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold text-indigo-600 text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Học kỳ</label>
                <input
                  placeholder="HK1"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Năm học</label>
                <input
                  placeholder="2026-2027"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleCreate()}
            disabled={submitting}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Đang tạo...' : 'Tạo Lớp học phần'}
          </button>
        </Card>
      )}

      <Card>
        {filteredClasses.length === 0 ? <Empty msg="Không tìm thấy lớp học phần nào" /> : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-neutral-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Mã lớp HP</th>
                    <th className="py-3.5 px-4">Tên lớp HP</th>
                    <th className="py-3.5 px-4">Tên Môn học</th>
                    <th className="py-3.5 px-4">Giảng viên</th>
                    <th className="py-3.5 px-4 text-center">Sĩ số tối đa</th>
                    <th className="py-3.5 px-4 text-center">Học kỳ</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                  {paginatedClasses.map((c) => (
                    <tr key={c.id} className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.classCode}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800 dark:text-slate-100">
                        <Link to={`/admin/classes/${c.id}`} className="hover:underline text-indigo-600 dark:text-indigo-400">{c.className}</Link>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{c.courseTitle || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {c.lecturerName ? (
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{c.lecturerName}</span>
                        ) : (
                          <span className="italic text-amber-600 dark:text-amber-400">Chưa phân công</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        <span className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700 font-extrabold">{c.maxStudents ?? 'Không giới hạn'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center"><Pill intent="success">{c.semester} · {c.academicYear}</Pill></td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="rounded px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 transition cursor-pointer"
                        >
                          Sửa / Gán GV
                        </button>
                        <button
                          type="button"
                          onClick={() => void openScheduleModal(c)}
                          className="rounded px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900 transition cursor-pointer"
                        >
                          📅 Xếp lịch học
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(c.id)}
                          className="rounded px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-slate-800 pt-3 mt-3 px-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-bold text-slate-800 dark:text-slate-200">{filteredClasses.length > 0 ? page * pageSize + 1 : 0}</span> - <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min((page + 1) * pageSize, filteredClasses.length)}</span> trên tổng số <span className="font-bold text-slate-800 dark:text-slate-200">{filteredClasses.length}</span> lớp học phần
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
                  className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                >
                  <option value={10}>10 dòng / trang</option>
                  <option value={20}>20 dòng / trang</option>
                  <option value={50}>50 dòng / trang</option>
                </select>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  &laquo; Trước
                </button>

                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium px-1">
                  Trang {page + 1} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
                >
                  Sau &raquo;
                </button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Xếp lịch giảng dạy & Phòng học */}
      {scheduleClazz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  Xếp lịch giảng dạy & Phòng học
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Lớp: <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{scheduleClazz.classCode}</span> — {scheduleClazz.className}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScheduleClazz(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            {scheduleErr && (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                {scheduleErr}
              </div>
            )}

            {/* List of current schedule items */}
            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Danh sách ca học đã xếp ({classSchedules.length})
              </h4>
              {loadingSchedules ? (
                <Spinner />
              ) : classSchedules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-700">
                  Lớp học phần này chưa có lịch giảng dạy nào. Vui lòng thêm bên dưới.
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
                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-700 dark:bg-slate-900/50"
                      >
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="rounded-lg bg-indigo-600 px-2.5 py-1 font-bold text-white">
                            {dayLabel}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-200">
                            Tiết {s.startPeriod} - {s.endPeriod} ({startInfo} - {endInfo})
                          </span>
                          <span className="rounded-md bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 font-mono font-bold text-amber-800 dark:text-amber-300">
                            🏢 Phòng: {s.room || 'Chưa xếp'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleDeleteSchedule(s.id)}
                          className="rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
                        >
                          Xóa
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Form to add a new schedule slot */}
            <form onSubmit={handleAddSchedule} className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                + Thêm lịch / ca học mới
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Thứ trong tuần</label>
                  <select
                    value={scheduleForm.dayOfWeek}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, dayOfWeek: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  >
                    {Object.entries(DAY_NAMES).map(([val, name]) => (
                      <option key={val} value={val}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tiết bắt đầu</label>
                  <select
                    value={scheduleForm.startPeriod}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, startPeriod: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <option key={p} value={p}>Tiết {p} ({PERIOD_TIMES[p]?.start})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Tiết kết thúc</label>
                  <select
                    value={scheduleForm.endPeriod}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, endPeriod: Number(e.target.value) })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((p) => (
                      <option key={p} value={p}>Tiết {p} ({PERIOD_TIMES[p]?.end})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 dark:text-slate-400 mb-1">Phòng học</label>
                  <input
                    type="text"
                    placeholder="VD: A2-301, B1-102"
                    value={scheduleForm.room}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-2.5 py-2 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleClazz(null)}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={savingSchedule}
                  className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  {savingSchedule ? 'Đang lưu...' : '+ Thêm ca học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}