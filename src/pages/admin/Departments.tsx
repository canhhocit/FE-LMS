import { useEffect, useState } from 'react';
import { Building2, Plus, Search, Edit3, Trash2 } from 'lucide-react';
import * as deptService from '../../services/departmentService';
import { PageHeader, Card, Button, Input, Textarea, Spinner, Empty, ErrorBox } from '../../components/ui';
import type { DepartmentResponse, DepartmentRequest } from '../../services/departmentService';

export default function AdminDepartments() {
  const [depts, setDepts] = useState<DepartmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const list = await deptService.getDepartments();
      setDepts(list);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await deptService.getDepartments();
        if (mounted) setDepts(list);
      } catch (e: unknown) {
        if (mounted) setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

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
  if (err && !depts.length) return <ErrorBox message={err} />;

  const filteredDepts = depts.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Quản lý Khoa / Bộ môn' }]}
        title="Quản lý Khoa & Bộ môn"
        subtitle="Quản lý danh sách các khoa viện, tổ chức bộ môn và thông tin Trưởng khoa"
        actions={
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4" /> Thêm Khoa mới
          </Button>
        }
      />

      {err && <ErrorBox message={err} />}

      {showForm && (
        <Card>
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">
            {editId ? 'Sửa thông tin Khoa / Bộ môn' : 'Thêm Khoa / Bộ môn mới'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mã khoa *</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: CNTT"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên khoa *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="VD: Công nghệ thông tin"
              />
            </div>
          </div>
          <div className="mb-4 text-xs">
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Mô tả</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Nhập mô tả giới thiệu về Khoa..."
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={cancel}>Huỷ</Button>
            <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu thông tin'}
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-navy-700 dark:text-navy-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Danh sách Khoa / Bộ môn ({filteredDepts.length})
            </h3>
          </div>
          <div className="w-64">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm theo mã, tên..."
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
        </div>

        {filteredDepts.length === 0 ? (
          <Empty msg="Chưa có khoa/bộ môn nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mã khoa</th>
                  <th className="py-3.5 px-4">Tên khoa</th>
                  <th className="py-3.5 px-4">Mô tả</th>
                  <th className="py-3.5 px-4">Trưởng khoa</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredDepts.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900 dark:text-navy-300">{d.code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{d.name}</td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">{d.description || '-'}</td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{d.headUserName || '-'}</td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(d)}>
                        <Edit3 className="w-3.5 h-3.5" /> Sửa
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" /> Xóa
                      </Button>
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
