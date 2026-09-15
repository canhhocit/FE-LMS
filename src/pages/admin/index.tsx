// Admin pages
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as clazzService from '../../services/clazzService';
import * as adminService from '../../services/adminService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import { importUsersByRole, exportUsersByRole, createUser, updateUser, deleteUser, resetPassword, updateUserStatus } from '../../services/userService';
import type { UserCreateRequest } from '../../services/userService';
import type { Clazz, User, DashboardStats, Role } from '../../types';

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
    { label: 'Người dùng', val: stats.totalUsers, color: 'text-indigo-300' },
    { label: 'Lảp học', val: stats.totalClasses, color: 'text-emerald-300' },
    { label: 'đầng ký học, val: stats.totalEnrollments, color: 'text-amber-300' },
    { label: 'Bøi tập', val: stats.totalAssignments, color: 'text-rose-300' },
    { label: 'Bài đã nộp', val: stats.totalSubmissions, color: 'text-cyan-300' },
  ];
  return (
    <div>
      <PageTitle>Dashboard qtản trị</PageTitle>
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
  const [tab, sepTab] = useState<'STUDENT' | 'LECTURER'>('STUDENT');
  const [kw, setKw] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserCreateRequest>({ email: '', fullName: '', role: 'STUDENT' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    let mounted = true;
    const p = tab === 'STUDENT' ? adminService.listStudents(kw) : adminService.listLecturers(kw);
    p.then((data) => mounted && setUsers(data)).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [tab, kw]);

  useEffect(() => { const cleanup = load(); return cleanup; }, [load]);

  const handleImport = async () => {
    if (!selectedFile) { setImportMsg('Vui lòng chọn file Excel trúcc khi import.'); return; }
    setImporting(true); setImportMsg(null);
    try {
      const result = await importUsersByRole(tab, selectedFile);
      setImportMsg(`Import thành công: ${result.length} tài khởn. `);
      setSelectedFile(null); load();
    } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Import thạt bại.'); }
    finally { setImporting(false); }
  };

  const handleExport = async () => {
    try {
      const blob = await exportUsersByRole(tab);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = tab === 'LECTURER' ? 'lecturers.xlsx' : 'students.xlsx';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Xuạt file thạt bại.'); }
  };

  const openCreateForm = () => {
    setEditingUser(null);
    setFormData({ email: '', fullName: '', role: tab, password: '' });
    setShowForm(true);
  };

  const openEditForm = (u: User) => {
    setEditingUser(u);
    setFormData({ email: u.email, fullName: u.fullName, role: u.role });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingUser) { await updateUser(editingUser.id, formData); } else { await createUser(formData); }
      setShowForm(false); load();
    } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Lõu thất ba��i.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Ba��n có chác muốn xoá ngòi dóng này')) return;
    try { await deleteUser(id); load(); } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Xoá thạt bại.'); }
  };

  const handleResetPw = async (id: number) => {
    if (!confirm('Đất lải mật khằu mạc định cho ngòi dóng này')) return;
    try { await resetPassword(id); setImportMsg('Để đạt dại mạt kháu.'); } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Thạt bại.'); }
  };

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.active !== false ? 'INACTIVE' : 'ACTIVE';
    try { await updateUserStatus(u.id, newStatus); load(); } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Thất ba��i.'); }
  };

  return (
    <div>
      <PageTitle>Ngường dùng</PageTitle>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {(['STUDENT', 'LECTURER'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {t === 'STUDENT' ? 'Sinh viên' : 'Giảng viên']
          </button>
        ))}
        <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="Tìm theo tên/email…"
          className="ml-auto min-w-55 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-700" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button onClick={openCreateForm} className="px-3 py-2 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-500">+ Tạo ngường dùng</button>
        <label className="inline-flex items-center gap-2 rounded border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setSelectedFile(e.target.files?[0] ?? null)} />
          {selectedFile ? selectedFile.name : 'Chọn file Excel'}
        </label>
        <button onClick={handleImport} disabled={importing || !selectedFile}
          className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500">
          {importing ? 'Đang import…' : 'Import file'}
        </button>
        <button onClick={handleExport} className="px-3 py-2 rounded text-sm bg-slate-200 text-slate-700 hover:bg-slate-300">Xuạt Excel</button>
      </div>

      {importMsg && <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">{importMsg}</div>}

      {showForm && (
        <Card>
          <h3 className="font-semibold mb-3">{editingUser ? 'S㻟i ngường dùng' : 'Tạo ngòi dóng dóng mầi'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-500">Email</label>
              <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm" disabled={!!editingUser} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Hể têm</label>
              <input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm" />
            </div>
            {!editingUser && (
              <div>
                <label className="text-xs text-slate-500">Mạt khậu</label>
                <input type="password" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm" />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500">Vai trà</label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm">
                <option value="STUDENT">Sinh viêm</option>
                <option value="LECTURER">Giảng viên</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} disabled={saving || !formData.email || !formData.fullName}
              className="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white disabled:opacity-50">{saving ? 'Đang lƵ...' : 'Lư'}</button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded text-sm bg-slate-200 text-slate-700">Hu�y</button>
          </div>
        </Card>
      )}

      <Card>
        {loading ? <Spinner /> : users.length === 0 ? <Empty msg="Không`ó kết ka��" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr><th className="text-left py-2">#</th><th>Ho�� têm</th><th>Email</th><th>Trạt thái</th><th className="text-right">Tháo tác</th></tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-slate-200/80">
                  <td className="py-2 text-slate-500">{i + 1}</td>
                  <td className="text-slate-800">{u.fullName}</td>
                  <td className="text-slate-500">{u.email}</td>
                  <td><Pill color={u.active !== false ? 'green' : 'red'}>{u.active !== false ? 'Active' : 'Inactive'}</Pill></td>
                  <td className="text-right space-x-1">
                    <button onClick={() => openEditForm(u)} className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200">Sẽ</button>
                    <button onClick={() => handleResetPw(u.id)} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Reset PW</button>
                    <button onClick={() => handleToggleStatus(u)} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 hover:bg-slate-200">
                      {u.active !== false ? 'Khoá' : 'Mở'}
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">Xoá</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export function AdminClasses() {
  const [classes, setClasses] = useState<Clazz[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    clazzService.getMyClasses().then((c) => m && setClasses(c)).finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Tạt cạ lụp xọc</PageTitle>
      <Card>
        {classes.length === 0 ? <Empty msg="Chưa có la��p nào" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left py-2">Mä</th><th className="text-left">Tên lẩp</th><th>Giảng viên</th><th>SV</th><th>Trạn thái</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((c) => (
                <tr key={c.id} className="border-b border-slate-800/50">
                  <td className="py-2 font-mono text-indigo-300">{c.classCode}</td>
                  <td><Link to={`/admin/classes/${c.id}`} className="hover:underline">{c.className}</Link></td>
                  <td className="text-slate-400">{c.lecturerName}</td>
                  <td className="text-center">{c.maxStudents}</td>
                  <td><Pill color="green">{c.semester}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
