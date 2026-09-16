import { useEffect, useState } from 'react';
import * as acService from '../../services/adminClassService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { AdminClassResponse, AdminClassRequest } from '../../services/adminClassService';
import type { User } from '../../types';

export default function AdminAdministrativeClasses() {
  const [classes, setClasses] = useState<AdminClassResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [className, setClassName] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<User[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);

  const load = async () => {
    try {
      const list = await acService.getAllAdminClasses();
      setClasses(list);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setClassName(''); setAcademicYear(''); setShowForm(true); };
  const openEdit = (c: AdminClassResponse) => { setEditId(c.id); setClassName(c.className); setAcademicYear(c.academicYear ?? ''); setShowForm(true); };
  const cancel = () => setShowForm(false);

  const handleSave = async () => {
    if (!className.trim()) return;
    setSaving(true);
    try {
      const data: AdminClassRequest = { className: className.trim(), academicYear: academicYear.trim() || undefined };
      if (editId) {
        await acService.updateAdminClass(editId, data);
      } else {
        await acService.createAdminClass(data);
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
    if (!confirm('Xoá lớp hành chính này?')) return;
    try {
      await acService.deleteAdminClass(id);
      await load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Xoá thất bại');
    }
  };

  const viewStudents = async (id: number) => {
    try {
      const students = await acService.getStudentsByAdminClass(id);
      setSelectedStudents(students);
      setSelectedClassId(id);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tải được sinh viên');
    }
  };

  if (loading) return <Spinner />;
  if (err && !classes.length) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle>Quản lý Lớp hành chính</PageTitle>
        <button aria-label="button" onClick={openCreate} className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition shadow-sm">+ Tạo lớp</button>
      </div>

      {err && <div className="p-3 rounded-lg text-sm bg-rose-50 border border-rose-200 text-rose-700">{err}</div>}

      {showForm && (
        <Card>
          <h3 className="font-bold text-slate-800 mb-4">{editId ? 'Sửa lớp hành chính' : 'Tạo lớp hành chính mới'}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Tên lớp</label>
              <input value={className} onChange={e => setClassName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500" placeholder="VD: DHCN20A" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Khóa</label>
              <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-violet-500 focus:border-violet-500" placeholder="VD: 2024" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button aria-label="button" onClick={cancel} className="px-4 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:bg-slate-50 transition">Huỷ</button>
            <button aria-label="button" onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50 transition">{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            {classes.length === 0 ? <Empty msg="Chưa có lớp hành chính" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-slate-500 border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="text-left p-3">Tên lớp</th>
                      <th className="text-left p-3">Khoa</th>
                      <th className="text-left p-3">Cố vấn HT</th>
                      <th className="text-center p-3">SV</th>
                      <th className="text-center p-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition">
                        <td className="p-3 font-semibold text-violet-700">{c.className}</td>
                        <td className="p-3 text-slate-500">{c.facultyName || '-'}</td>
                        <td className="p-3 text-slate-500">{c.advisorName || '-'}</td>
                        <td className="p-3 text-center"><Pill color="indigo">{c.studentCount ?? 0}</Pill></td>
                        <td className="p-3 text-center space-x-1">
                          <button aria-label="button" onClick={() => viewStudents(c.id)} className="px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition">SV</button>
                          <button aria-label="button" onClick={() => openEdit(c)} className="px-2 py-1 rounded text-xs bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition">Sửa</button>
                          <button aria-label="button" onClick={() => handleDelete(c.id)} className="px-2 py-1 rounded text-xs bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition">Xoá</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card>
            <h3 className="font-bold text-slate-800 mb-3">{"Sinh viên " + (selectedClassId ? "(Lớp #" + selectedClassId + ")" : "")}</h3>
            {selectedStudents.length === 0 ? <Empty msg="Chọn lớp để xem SV" /> : (
              <ul className="space-y-2 max-h-96 overflow-y-auto">
                {selectedStudents.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{(s.fullName || s.email || '?').charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="text-sm font-medium text-slate-800">{s.fullName || s.email}</div>
                      <div className="text-xs text-slate-400">{s.email || s.studentCode || ''}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
