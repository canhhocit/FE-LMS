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
    { label: 'NgÆ°á»i dĂ¹ng', val: stats.totalUsers, color: 'text-indigo-300' },
    { label: 'Láº£p há»c', val: stats.totalClasses, color: 'text-emerald-300' },
        { label: 'Đăng ký học', val: stats.totalEnrollments, color: 'text-amber-300' },
    { label: 'BĂ¸i táº­p', val: stats.totalAssignments, color: 'text-rose-300' },
    { label: 'BĂ i Ä‘Ă£ ná»™p', val: stats.totalSubmissions, color: 'text-cyan-300' },
  ];
  return (
    <div>
      <PageTitle>Dashboard qtáº£n trá»‹</PageTitle>
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
    if (!selectedFile) { setImportMsg('Vui lĂ²ng chá»n file Excel trĂºcc khi import.'); return; }
    setImporting(true); setImportMsg(null);
    try {
      const result = await importUsersByRole(tab, selectedFile);
      setImportMsg(`Import thĂ nh cĂ´ng: ${result.length} tĂ i khá»Ÿn. `);
      setSelectedFile(null); load();
    } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Import tháº¡t báº¡i.'); }
    finally { setImporting(false); }
  };

  const handleExport = async () => {
    try {
      const blob = await exportUsersByRole(tab);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url;
      link.download = tab === 'LECTURER' ? 'lecturers.xlsx' : 'students.xlsx';
      document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Xuáº¡t file tháº¡t báº¡i.'); }
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
    } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'LĂµu tháº¥t baº¡i.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Baº£n cĂ³ chĂ¡c muá»‘n xoĂ¡ ngĂ²i dĂ³ng nĂ y')) return;
    try { await deleteUser(id); load(); } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'XoĂ¡ tháº¡t báº¡i.'); }
  };

  const handleResetPw = async (id: number) => {
    if (!confirm('Äáº¥t láº£i máº­t kháº±u máº¡c Ä‘á»‹nh cho ngĂ²i dĂ³ng nĂ y')) return;
    try { await resetPassword(id); setImportMsg('Äá»ƒ Ä‘áº¡t dáº¡i máº¡t khĂ¡u.'); } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Tháº¡t báº¡i.'); }
  };

  const handleToggleStatus = async (u: User) => {
    const newStatus = u.active !== false ? 'INACTIVE' : 'ACTIVE';
    try { await updateUserStatus(u.id, newStatus); load(); } catch (e: unknown) { setImportMsg((e as { message?: string })?.message ?? 'Tháº¥t baº¡i.'); }
  };

  return (
    <div>
      <PageTitle>NgÆ°á»ng dĂ¹ng</PageTitle>
      <div className="flex flex-wrap gap-2 mb-3 items-center">
        {(['STUDENT', 'LECTURER'] as const).map((t) => (
          <button aria-label="button" key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded text-sm ${tab === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            {t === 'STUDENT' ? 'Sinh viên' : 'Giảng viên'}
          </button>
        ))}
        <input value={kw} onChange={(e) => setKw(e.target.value)} placeholder="TĂ¬m theo tĂªn/emailâ€¦"
          className="ml-auto min-w-55 px-3 py-1.5 bg-white border border-slate-200 rounded text-sm text-slate-700" />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button aria-label="button" onClick={openCreateForm} className="px-3 py-2 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-500">+ Táº¡o ngÆ°á»ng dĂ¹ng</button>
        <label className="inline-flex items-center gap-2 rounded border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer">
          <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} />
          {selectedFile ? selectedFile.name : 'Chá»n file Excel'}
        </label>
        <button aria-label="button" onClick={handleImport} disabled={importing || !selectedFile}
          className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500">
          {importing ? 'Äang importâ€¦' : 'Import file'}
        </button>
        <button aria-label="button" onClick={handleExport} className="px-3 py-2 rounded text-sm bg-slate-200 text-slate-700 hover:bg-slate-300">Xuáº¡t Excel</button>
      </div>

      {importMsg && <div className="mb-3 rounded border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-2 text-sm">{importMsg}</div>}

      {showForm && (
        <Card>
          <h3 className="font-semibold mb-3">{editingUser ? 'Să»Ÿi ngÆ°á»ng dĂ¹ng' : 'Táº¡o ngĂ²i dĂ³ng dĂ³ng máº§i'}</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs text-slate-500">Email</label>
              <input value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm" disabled={!!editingUser} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Há»ƒ tĂªm</label>
              <input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm" />
            </div>
            {!editingUser && (
              <div>
                <label className="text-xs text-slate-500">Máº¡t kháº­u</label>
                <input type="password" value={formData.password || ''} onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm" />
              </div>
            )}
            <div>
              <label className="text-xs text-slate-500">Vai trĂ </label>
              <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value as Role})}
                className="w-full px-2 py-1.5 rounded border border-slate-200 text-sm">
                <option value="STUDENT">Sinh viĂªm</option>
                <option value="LECTURER">Giáº£ng viĂªn</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button aria-label="button" onClick={handleSave} disabled={saving || !formData.email || !formData.fullName}
              className="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white disabled:opacity-50">{saving ? 'Äang lÆµ...' : 'LÆ°'}</button>
            <button aria-label="button" onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded text-sm bg-slate-200 text-slate-700">Huă±y</button>
          </div>
        </Card>
      )}

      <Card>
        {loading ? <Spinner /> : users.length === 0 ? <Empty msg="KhĂ´ng`Ă³ káº¿t kaº¡" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-200">
              <tr><th className="text-left py-2">#</th><th>Ho»ƒ tĂªm</th><th>Email</th><th>Tráº¡t thĂ¡i</th><th className="text-right">ThĂ¡o tĂ¡c</th></tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className="border-b border-slate-200/80">
                  <td className="py-2 text-slate-500">{i + 1}</td>
                  <td className="text-slate-800">{u.fullName}</td>
                  <td className="text-slate-500">{u.email}</td>
                  <td><Pill color={u.active !== false ? 'green' : 'red'}>{u.active !== false ? 'Active' : 'Inactive'}</Pill></td>
                  <td className="text-right space-x-1">
                    <button aria-label="button" onClick={() => openEditForm(u)} className="px-2 py-1 text-xs rounded bg-amber-100 text-amber-700 hover:bg-amber-200">Sáº½</button>
                    <button aria-label="button" onClick={() => handleResetPw(u.id)} className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-700 hover:bg-blue-200">Reset PW</button>
                    <button aria-label="button" onClick={() => handleToggleStatus(u)} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 hover:bg-slate-200">
                      {u.active !== false ? 'KhoĂ¡' : 'Má»Ÿ'}
                    </button>
                    <button aria-label="button" onClick={() => handleDelete(u.id)} className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200">XoĂ¡</button>
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
      <PageTitle>Táº¡t cáº¡ lá»¥p xá»c</PageTitle>
      <Card>
        {classes.length === 0 ? <Empty msg="ChÆ°a cĂ³ laº£p nĂ o" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left py-2">MĂ¤</th><th className="text-left">TĂªn láº©p</th><th>Giáº£ng viĂªn</th><th>SV</th><th>Tráº¡n thĂ¡i</th>
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

