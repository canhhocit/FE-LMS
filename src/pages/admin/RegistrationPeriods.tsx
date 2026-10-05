import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Calendar, ToggleLeft, ToggleRight, Trash2, Settings, X } from 'lucide-react';
import * as registrationService from '../../services/registrationService';
import { PageHeader, Card, Button, Input, Select, Badge, Spinner, Empty, ErrorBox } from '../../components/ui';
import type { RegistrationPeriod, Clazz } from '../../types';

const parseDate = (val: unknown): Date | null => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (Array.isArray(val)) {
    const [y, m, d, h = 0, min = 0, s = 0] = val;
    return new Date(y, m - 1, d, h, min, s);
  }
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    let d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    d = new Date(trimmed.replace(' ', 'T'));
    if (!isNaN(d.getTime())) return d;

    const timeFirstMatch = trimmed.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?\s+(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (timeFirstMatch) {
      const [, h, min, s = '0', day, mon, yr] = timeFirstMatch;
      return new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(min), Number(s));
    }
    const dateFirstMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/);
    if (dateFirstMatch) {
      const [, day, mon, yr, h = '0', min = '0', s = '0'] = dateFirstMatch;
      return new Date(Number(yr), Number(mon) - 1, Number(day), Number(h), Number(min), Number(s));
    }
  }
  return null;
};

const fmt = (s?: unknown) => {
  const d = parseDate(s);
  return d ? d.toLocaleString('vi-VN') : '—';
};

export default function RegistrationPeriods() {
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showClassesModal, setShowClassesModal] = useState<RegistrationPeriod | null>(null);
  const [periodClasses, setPeriodClasses] = useState<Clazz[]>([]);
  const [allClasses, setAllClasses] = useState<Clazz[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);


  // Search, Filter & Pagination State
  const [searchKw, setSearchKw] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [form, setForm] = useState({
    name: '',
    semester: 'HK1',
    academicYear: '2026-2027',
    openAt: '',
    closeAt: '',
    maxCredits: '24',
    isActive: true,
  });

  const load = useCallback(() => {
    let mounted = true;
    registrationService.getRegistrationPeriods()
      .then((data) => mounted && setPeriods(data))
      .catch((e: unknown) => mounted && setErr((e as { message?: string })?.message ?? 'Lỗi'))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);


  const openClassesModal = async (period: RegistrationPeriod) => {
    setShowClassesModal(period);
    setLoadingClasses(true);
    setErr(null);
    try {
      const [pClasses, aClasses] = await Promise.all([
        registrationService.getPeriodClasses(period.id),
        // we can fetch all classes using a service if available, but let's assume we have it or can fetch from API directly
        import('../../services/api/client').then(m => m.unwrap(m.apiClient.get<Clazz[]>('/admin/classes')))
      ]);
      setPeriodClasses(pClasses);
      setAllClasses(aClasses as Clazz[]);
    } catch (e: any) {
      setErr(e.message || 'Lỗi tải danh sách lớp');
    } finally {
      setLoadingClasses(false);
    }
  };

  const handleAddClassToPeriod = async (clazzId: number) => {
    if (!showClassesModal) return;
    try {
      await registrationService.addClazzToPeriod(showClassesModal.id, clazzId);
      const updated = await registrationService.getPeriodClasses(showClassesModal.id);
      setPeriodClasses(updated);
      load(); // refresh main list to update count
    } catch (e: any) {
      alert(e.message || 'Lỗi thêm lớp');
    }
  };

  const handleRemoveClassFromPeriod = async (clazzId: number) => {
    if (!showClassesModal) return;
    try {
      await registrationService.removeClazzFromPeriod(showClassesModal.id, clazzId);
      const updated = await registrationService.getPeriodClasses(showClassesModal.id);
      setPeriodClasses(updated);
      load(); // refresh main list to update count
    } catch (e: any) {
      alert(e.message || 'Lỗi xóa lớp');
    }
  };

  const validateForm = () => {
    if (!form.name.trim()) return 'Vui lòng nhập tên đợt đăng ký';
    if (!form.openAt) return 'Vui lòng chọn thời gian bắt đầu';
    if (!form.closeAt) return 'Vui lòng chọn thời gian kết thúc';
    if (new Date(form.closeAt).getTime() <= new Date(form.openAt).getTime()) {
      return 'Thời gian kết thúc phải sau thời gian bắt đầu';
    }
    const maxCredits = Number(form.maxCredits);
    if (!Number.isFinite(maxCredits) || maxCredits <= 0) {
      return 'Số tín chỉ tối đa phải lớn hơn 0';
    }
    return null;
  };

  const submit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      await registrationService.createRegistrationPeriod({
        name: form.name.trim(),
        semester: form.semester,
        academicYear: form.academicYear,
        openAt: form.openAt,
        closeAt: form.closeAt,
        maxCredits: Number(form.maxCredits),
        isActive: form.isActive,
      });
      setShowForm(false);
      setForm({
        name: '',
        semester: 'HK1',
        academicYear: '2026-2027',
        openAt: '',
        closeAt: '',
        maxCredits: '24',
        isActive: true,
      });
      load();
    } catch (e: unknown) {
      setFormError((e as { message?: string })?.message ?? 'Tạo thất bại');
    } finally {
      setSubmitting(false);
    }
  };

  const toggle = async (p: RegistrationPeriod) => {
    try {
      await registrationService.updateRegistrationPeriod(p.id, { isActive: !p.isActive });
      load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể cập nhật trạng thái');
    }
  };

  const removePeriod = async (p: RegistrationPeriod) => {
    if (!confirm(`Bạn có chắc muốn xóa đợt đăng ký "${p.name}"?`)) return;
    try {
      await registrationService.deleteRegistrationPeriod(p.id);
      load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không thể xóa đợt đăng ký');
    }
  };

  if (loading) return <Spinner />;
  if (err && !periods.length) return <ErrorBox message={err} />;

  const filteredPeriods = periods.filter((p) => {
    const matchesSearch = !searchKw.trim() ||
      p.name.toLowerCase().includes(searchKw.toLowerCase()) ||
      p.semester.toLowerCase().includes(searchKw.toLowerCase()) ||
      p.academicYear.toLowerCase().includes(searchKw.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.isActive) ||
      (statusFilter === 'INACTIVE' && !p.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPeriods.length / pageSize) || 1;
  const paginatedPeriods = filteredPeriods.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Đợt Đăng ký Học tập' }]}
        title="Quản lý Đợt Đăng ký Học tập"
        subtitle="Mở/khóa đợt đăng ký môn học phần, quy định hạn ngạch tín chỉ tối đa và thời gian đóng mở portal"
        actions={
          <Button variant="primary" size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" />
            {showForm ? 'Hủy bỏ' : 'Mở đợt đăng ký mới'}
          </Button>
        }
      />

      {err && <ErrorBox message={err} />}

      {showForm && (
        <Card className="border border-navy-200 dark:border-navy-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-navy-700 dark:text-navy-300" />
            Cấu hình Đợt Đăng ký Môn học phần Mới
          </h3>

          {formError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {formError}
            </div>
          )}

          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Tên đợt đăng ký *</label>
              <Input
                placeholder="VD: Đợt 1 - Học kỳ 1 2026-2027"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Học kỳ</label>
              <Input
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Năm học</label>
              <Input
                value={form.academicYear}
                onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thời gian mở cổng *</label>
              <Input
                type="datetime-local"
                value={form.openAt}
                onChange={(e) => setForm({ ...form, openAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Thời gian đóng cổng *</label>
              <Input
                type="datetime-local"
                value={form.closeAt}
                onChange={(e) => setForm({ ...form, closeAt: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Số TC tối đa cho phép *</label>
              <Input
                type="number"
                min="1"
                value={form.maxCredits}
                onChange={(e) => setForm({ ...form, maxCredits: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowForm(false)}>Huỷ</Button>
            <Button variant="primary" size="sm" onClick={submit} disabled={submitting}>
              {submitting ? 'Đang lưu...' : 'Tạo đợt đăng ký'}
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Tìm theo tên đợt, học kỳ..."
              value={searchKw}
              onChange={(e) => { setSearchKw(e.target.value); setPage(0); }}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => { setStatusFilter('ALL'); setPage(0); }}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'ALL' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Tất cả
            </button>
            <button
              onClick={() => { setStatusFilter('ACTIVE'); setPage(0); }}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'ACTIVE' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Đang mở (Active)
            </button>
            <button
              onClick={() => { setStatusFilter('INACTIVE'); setPage(0); }}
              className={`px-3 py-1.5 rounded-md transition ${statusFilter === 'INACTIVE' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'}`}
            >
              Đã khóa
            </button>
          </div>
        </div>

        {filteredPeriods.length === 0 ? (
          <Empty msg="Chưa có đợt đăng ký môn học nào" />
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Tên đợt</th>
                    <th className="py-3.5 px-4">Học kỳ / Năm</th>
                    <th className="py-3.5 px-4">Thời gian mở portal</th>
                    <th className="py-3.5 px-4">Thời gian đóng portal</th>
                    <th className="py-3.5 px-4 text-center">Tín chỉ tối đa</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {paginatedPeriods.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">{p.semester} · {p.academicYear}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">{fmt(p.openAt)}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">{fmt(p.closeAt)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="info">{p.maxCredits ?? 24} TC</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={p.isActive ? 'success' : 'neutral'}>
                          {p.isActive ? 'Mở đăng ký' : 'Đã khóa'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <Button variant="ghost" size="sm" onClick={() => void toggle(p)}>
                          {p.isActive ? (
                            <span className="text-amber-600 flex items-center gap-1"><ToggleLeft className="w-3.5 h-3.5" /> Khóa</span>
                          ) : (
                            <span className="text-emerald-600 flex items-center gap-1"><ToggleRight className="w-3.5 h-3.5" /> Mở portal</span>
                          )}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void removePeriod(p)}>
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
                Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredPeriods.length > 0 ? page * pageSize + 1 : 0}</span> - <span className="font-semibold text-slate-800 dark:text-slate-200">{Math.min((page + 1) * pageSize, filteredPeriods.length)}</span> trên tổng số <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredPeriods.length}</span> đợt
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

      {/* Classes Modal */}
      {showClassesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Quản lý lớp học phần: <span className="text-indigo-600">{showClassesModal.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowClassesModal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {loadingClasses ? <Spinner /> : (
              <div className="flex-1 overflow-auto flex flex-col lg:flex-row gap-6 min-h-0">
                {/* Left: Available classes */}
                <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-50 dark:bg-slate-900 p-3 font-semibold text-sm border-b">Tất cả lớp học phần</div>
                  <div className="flex-1 overflow-auto p-2 space-y-2">
                    {allClasses.filter(c => !periodClasses.find(pc => pc.id === c.id)).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border">
                        <div className="text-sm">
                          <div className="font-bold">{c.classCode}</div>
                          <div className="text-xs text-slate-500">{c.className}</div>
                        </div>
                        <Button size="sm" onClick={() => handleAddClassToPeriod(c.id)}>Thêm</Button>
                      </div>
                    ))}
                    {allClasses.filter(c => !periodClasses.find(pc => pc.id === c.id)).length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">Không còn lớp nào để thêm</div>
                    )}
                  </div>
                </div>

                {/* Right: Added classes */}
                <div className="flex-1 border rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 font-semibold text-sm border-b">Đã chọn ({periodClasses.length})</div>
                  <div className="flex-1 overflow-auto p-2 space-y-2">
                    {periodClasses.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded border border-indigo-100 dark:border-indigo-900/50">
                        <div className="text-sm">
                          <div className="font-bold text-indigo-700 dark:text-indigo-400">{c.classCode}</div>
                          <div className="text-xs text-slate-500">{c.className}</div>
                        </div>
                        <Button variant="danger" size="sm" onClick={() => handleRemoveClassFromPeriod(c.id)}>Xóa</Button>
                      </div>
                    ))}
                    {periodClasses.length === 0 && (
                      <div className="p-4 text-center text-sm text-slate-500">Chưa có lớp nào trong đợt này</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
