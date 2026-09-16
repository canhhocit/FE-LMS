import { useEffect, useState } from 'react';
import * as deptService from '../../services/departmentService';
import { PageTitle, Card, Spinner, Empty, ErrorBox } from '../../components/Layout';
import type { DepartmentResponse, DepartmentRequest } from '../../services/departmentService';

export default function AdminDepartments() {
  const [depts, setDepts] = useState<DepartmentResponse[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const filtered = depts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase()));
    try {
      const list = await deptService.getDepartments();
      setDepts(list);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setCode(''); setName(''); setDescription(''); setShowForm(true); };
  const openEdit = (d: DepartmentResponse) => { setEditId(d.id); setCode(d.code); setName(d.name); setDescription(d.description ?? ''); setShowForm(true); };
  const cancel = () => setShowForm(false);

  const handleSave = async () => {
    if (!code.trim() || !name.trim()) return;
    setSaving(true);
    try {
      const data: DepartmentRequest = { code: code.trim(), name: name.trim(), description: description.trim() || undefined };
      if (editId) {
        await deptService.updateDepartment(editId, data);
      } else {
        await deptService.createDepartment(data);
      }
      setShowForm(false);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lưu thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xoá khoa/bộ môn này?')) return;
    try {
      await deptService.deleteDepartment(id);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xoá thất bại');
    }
  };

  if (loading) return <Spinner />;
  if (err && !depts.length) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>Quản lý Khoa / Bộ môn</PageTitle>
        <button aria-label="button" onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition shadow-sm">+ Thêm khoa</button>
      </div>

      {err && <div className="p-3 rounded-lg text-sm bg-rose-50 border border-rose-200 text-rose-700">{err}</div>}

      {showForm && (
        <Card>
          <h3 className="font-bold text-slate-800 mb-4">{editId ? 'Sửa khoa/bộ môn' : 'Thêm khoa/bộ môn mới'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Mã khoa</label>
              <input value={code} onChange={e => setCode(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="VD: CNTT" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên khoa</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="VD: Công nghệ thông tin" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 mb-1">Mô tả</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <div className="flex gap-2 justify-end">
            <button aria-label="button" onClick={cancel} className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Huỷ</button>
            <button aria-label="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 transition">{saving ? 'Äang lÆ°u...' : 'Lưu'}</button>
          </div>
        </Card>
      )}

      <Card>
        {depts.length === 0 ? <Empty msg="Chưa có khoa/bộ môn nào" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="text-left p-3">Mã</th>
                  <th className="text-left p-3">Tên khoa</th>
                  <th className="text-left p-3">Mô tả</th>
                  <th className="text-left p-3">Trưởng khoa</th>
                  <th className="text-center p-3">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {depts.filter((d: DepartmentResponse) => d.name.toLowerCase().includes(search.toLowerCase()) || d.code.toLowerCase().includes(search.toLowerCase())).map((d: DepartmentResponse) => (
                  <tr key={d.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                    <td className="p-3 font-mono text-indigo-600 font-semibold">{d.code}</td>
                    <td className="p-3 text-slate-800 font-medium">{d.name}</td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{d.description || '-'}</td>
                    <td className="p-3 text-slate-500">{d.headUserName || '-'}</td>
                    <td className="p-3 text-center space-x-1">
                      <button aria-label="button" onClick={() => openEdit(d)} className="px-2 py-1 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition">Sửa</button>
                      <button aria-label="button" onClick={() => handleDelete(d.id)} className="px-2 py-1 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition">Xoá</button>
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


