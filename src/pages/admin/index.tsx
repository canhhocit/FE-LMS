// Admin pages
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as adminService from '../../services/adminService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import { importUsersByRole, exportUsersByRole, resetPassword } from '../../services/userService';
import * as adminClassService from '../../services/adminClassService';
import type { AdminClassResponse } from '../../services/adminClassService';
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
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<number | null>(null);

  useEffect(() => {
    adminClassService.getAllAdminClasses().then((list) => setAdminClasses(list)).catch(() => setAdminClasses([]));
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
        <label className="inline-flex items-center gap-2 rounded border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer">
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
                      <button
                        type="button"
                        onClick={() => void handleResetPassword(u)}
                        disabled={resettingId === u.id}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-300 disabled:opacity-50 transition"
                      >
                        {resettingId === u.id ? 'Đang reset...' : (
                          <span className="inline-flex items-center gap-1">
                            <svg className="h-3.5 w-3.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m-5 4a5 5 0 01-5-5 5 5 0 015-5 5 5 0 015 5 5 5 0 01-5 5zm0 0v1a2 2 0 01-2 2h-2a2 2 0 00-2 2v3h2v-2h2v-2h2a2 2 0 002-2v-1.333a5.05 5.05 0 001.36-.67l1.36 1.36a1 1 0 001.414 0l1.414-1.414a1 1 0 000-1.414l-1.36-1.36a5.05 5.05 0 00.67-1.36H15z" /></svg>
                            Reset MK
                          </span>
                        )}
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

export function AdminClasses() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [courses, setCourses] = useState<import('../../types').Course[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
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
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{c.lecturerName || '-'}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                      <span className="rounded bg-indigo-50 px-2 py-1 text-xs text-indigo-700 font-extrabold">{c.maxStudents ?? 'Không giới hạn'}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center"><Pill intent="success">{c.semester} · {c.academicYear}</Pill></td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => void handleDelete(c.id)}
                        className="rounded px-2 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50"
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