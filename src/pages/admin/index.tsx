import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as adminService from '../../services/adminService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import { importUsersByRole, exportUsersByRole, resetPassword, createUser, updateUser, updateUserStatus, type UserCreateRequest } from '../../services/userService';
import * as adminClassService from '../../services/adminClassService';
import type { AdminClassResponse } from '../../services/adminClassService';
import { getDepartments, type DepartmentResponse } from '../../services/departmentService';
import type { Clazz, User, DashboardStats } from '../../types';

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
  const items: { label: string; val: number; color: string }[] = [
    { label: 'Người dùng',     val: stats.totalUsers,       color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'Lớp học',        val: stats.totalClasses,     color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Đăng ký học',    val: stats.totalEnrollments, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Bài tập',        val: stats.totalAssignments, color: 'text-rose-600 dark:text-rose-400' },
    { label: 'Bài đã nộp',     val: stats.totalSubmissions, color: 'text-cyan-600 dark:text-cyan-400' },
  ];
  return (
    <div>
      <PageTitle>Dashboard quản trị</PageTitle>
      <div className="grid md:grid-cols-5 gap-4">
        {items.map((i) => (
          <Card key={i.label}>
            <div className="text-xs text-slate-400">{i.label}</div>
            <div className={`text-3xl font-bold ${i.color}`}>{i.val}</div>
          </Card>
        ))}
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
    const p = tab === 'STUDENT' ? adminService.listStudents(kw) : adminService.listLecturers(kw);
    p.then((data) => mounted && setUsers(data)).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [tab, kw]);

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
          <button key={t} onClick={() => { setTab(t); setSelectedClass(''); }}
            className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {t === 'STUDENT' ? 'Sinh viên' : 'Giảng viên'}
          </button>
        ))}

        {tab === 'STUDENT' && adminClasses.length > 0 && (
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
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

        <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm theo tên/email…"
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
        {loading ? <Spinner /> : filteredUsers.length === 0 ? <Empty msg="Không có kết quả" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">{tab === 'STUDENT' ? 'Mã SV' : 'Mã GV'}</th>
                  <th className="text-left p-3">Họ tên</th>
                  <th className="text-left p-3">Email</th>
                  <th className="text-left p-3">{tab === 'STUDENT' ? 'Lớp hành chính' : 'Khoa / Bộ môn'}</th>
                  <th className="text-center p-3">Trạng thái</th>
                  <th className="text-center p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => (
                  <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-3 text-slate-500">{i + 1}</td>
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
                          {ac.className} ({ac.code || ac.id})
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

  if (loading) return <Spinner />;

  return (
    <div>
      <PageTitle>Quản lý Lớp học phần</PageTitle>
      
      {err && (
        <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 flex justify-between items-center">
          <span>{err}</span>
          <button onClick={() => setErr(null)} className="text-xs font-semibold">Đóng</button>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-sm text-slate-500">Tạo và phân công giảng viên, đặt sĩ số giới hạn cho các Lớp học phần</div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
        >
          {showForm ? 'Hủy' : '+ Tạo Lớp học phần mới'}
        </button>
      </div>

      {editingClazz && (
        <Card className="mb-6 border-2 border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20">
          <div className="flex items-center justify-between mb-3 border-b border-indigo-100 pb-2">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200">
              Chỉnh sửa & Phân công Giảng viên cho lớp: <span className="font-mono text-indigo-700 dark:text-indigo-300">{editingClazz.classCode}</span>
            </h3>
            <button onClick={() => setEditingClazz(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700">Hủy</button>
          </div>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mã lớp học phần *</label>
              <input
                value={editForm.classCode}
                onChange={(e) => setEditForm({ ...editForm, classCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên lớp học phần *</label>
              <input
                value={editForm.className}
                onChange={(e) => setEditForm({ ...editForm, className: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Môn học (Khóa học)</label>
              <select
                value={editForm.courseId}
                onChange={(e) => setEditForm({ ...editForm, courseId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
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
              <label className="block text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-1 font-bold">
                Giảng viên phụ trách (Gán lại)
              </label>
              <select
                value={editForm.lecturerId}
                onChange={(e) => setEditForm({ ...editForm, lecturerId: e.target.value })}
                className="w-full rounded-lg border-2 border-indigo-300 bg-white px-3 py-2 font-semibold text-indigo-900 shadow-sm focus:border-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-indigo-600 dark:text-indigo-200"
              >
                <option value="">-- Chưa gán giảng viên --</option>
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold text-indigo-600 dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Học kỳ</label>
                <input
                  value={editForm.semester}
                  onChange={(e) => setEditForm({ ...editForm, semester: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Năm học</label>
                <input
                  value={editForm.academicYear}
                  onChange={(e) => setEditForm({ ...editForm, academicYear: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:bg-slate-800 dark:border-slate-700"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => void handleUpdate()}
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 transition"
            >
              {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
            <button
              onClick={() => setEditingClazz(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Hủy
            </button>
          </div>
        </Card>
      )}

      {showForm && (
        <Card className="mb-6 border-2 border-indigo-100">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-3">Tạo Lớp học phần cho sinh viên đăng ký</h3>
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mã lớp học phần *</label>
              <input
                placeholder="VD: INT3306_01"
                value={form.classCode}
                onChange={(e) => setForm({ ...form, classCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên lớp học phần *</label>
              <input
                placeholder="VD: Lập trình Mạng - Nhóm 1"
                value={form.className}
                onChange={(e) => setForm({ ...form, className: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Môn học (Khóa học) *</label>
              <select
                value={form.courseId}
                onChange={(e) => setForm({ ...form, courseId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
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
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold text-indigo-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Học kỳ</label>
                <input
                  placeholder="HK1"
                  value={form.semester}
                  onChange={(e) => setForm({ ...form, semester: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Năm học</label>
                <input
                  placeholder="2026-2027"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => void handleCreate()}
            disabled={submitting}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submitting ? 'Đang tạo...' : 'Tạo Lớp học phần'}
          </button>
        </Card>
      )}

      <Card>
        {classes.length === 0 ? <Empty msg="Chưa có lớp học phần nào" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Mã lớp HP</th>
                  <th className="py-3 px-4">Tên lớp HP</th>
                  <th className="py-3 px-4">Tên Môn học</th>
                  <th className="py-3 px-4">Giảng viên</th>
                  <th className="py-3 px-4 text-center">Sĩ số tối đa</th>
                  <th className="py-3 px-4 text-center">Học kỳ</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {classes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
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
                        onClick={() => openEdit(c)}
                        className="rounded px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:text-indigo-300 dark:hover:bg-indigo-900 transition"
                      >
                        Sửa / Gán GV
                      </button>
                      <button
                        onClick={() => void handleDelete(c.id)}
                        className="rounded px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}