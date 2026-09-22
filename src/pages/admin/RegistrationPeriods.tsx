// Admin Registration Periods page
import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, Calendar } from 'lucide-react';
import * as registrationService from '../../services/registrationService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { RegistrationPeriod } from '../../types';

const fmt = (s?: string) => s ? new Date(s).toLocaleString('vi-VN') : '—';

export default function RegistrationPeriods() {
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

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

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

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

    setFormError(null);
    setSubmitting(true);
    try {
      await registrationService.createRegistrationPeriod({
        ...form,
        maxCredits: Number(form.maxCredits),
        isActive: true,
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
      setErr((e as { message?: string })?.message ?? 'Lỗi');
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered and Paginated Periods
  const filteredPeriods = periods.filter((p) => {
    const matchesSearch = !searchKw.trim() || p.name.toLowerCase().includes(searchKw.toLowerCase()) || (p.academicYear && p.academicYear.toLowerCase().includes(searchKw.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? p.isActive : !p.isActive);
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredPeriods.length / pageSize) || 1;
  const paginatedPeriods = filteredPeriods.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PageTitle>Đợt Đăng Ký Học Phần</PageTitle>
          <div className="text-xs text-slate-500 dark:text-slate-400 -mt-2">Quản lý và thiết lập khung thời gian đăng ký tín chỉ môn học cho sinh viên</div>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
        >
          {showForm ? 'Hủy bỏ' : '+ Tạo đợt đăng ký mới'}
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl border border-neutral-200 dark:border-slate-700">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchKw}
              onChange={(e) => { setSearchKw(e.target.value); setPage(0); }}
              placeholder="Tìm theo tên đợt, năm học..."
              className="w-full pl-9 pr-3 py-1.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as any); setPage(0); }}
            className="px-3 py-1.5 bg-neutral-50 dark:bg-slate-900 border border-neutral-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ACTIVE">Đang mở đăng ký</option>
            <option value="INACTIVE">Đã đóng đợt</option>
          </select>
        </div>
      </div>

      {showForm && (
        <Card className="border border-indigo-100 dark:border-indigo-900 bg-indigo-50/30 dark:bg-indigo-950/20">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            Tạo Đợt Đăng Ký Mới
          </h3>
          {formError && (
            <div role="alert" aria-live="assertive" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {formError}
            </div>
          )}
          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Tên đợt đăng ký <span className="text-rose-500">*</span></label>
              <input required placeholder="VD: Đợt đăng ký học phần HK1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Học kỳ</label>
              <input placeholder="HK1 / HK2 / HK3" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Năm học</label>
              <input placeholder="VD: 2026-2027" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Thời gian bắt đầu mở đợt <span className="text-rose-500">*</span></label>
              <input required type="datetime-local" value={form.openAt} onChange={(e) => setForm({ ...form, openAt: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Thời gian kết thúc <span className="text-rose-500">*</span></label>
              <input required type="datetime-local" value={form.closeAt} onChange={(e) => setForm({ ...form, closeAt: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-slate-600 dark:text-slate-300">Số tín chỉ tối đa</label>
              <input type="number" min="1" placeholder="Số tín chỉ tối đa (Mặc định 24)" value={form.maxCredits} onChange={(e) => setForm({ ...form, maxCredits: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold">Mở ngay đợt đăng ký này cho sinh viên</span>
              </label>
            </div>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-1.5 rounded-lg text-xs font-semibold border border-neutral-300 text-slate-600 hover:bg-neutral-100 transition cursor-pointer">Hủy</button>
            <button type="button" onClick={submit} disabled={submitting} className="rounded-lg bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60 cursor-pointer">
              {submitting ? 'Đang tạo...' : 'Tạo đợt đăng ký'}
            </button>
          </div>
        </Card>
      )}

      <Card>
        {filteredPeriods.length === 0 ? <Empty msg="Không tìm thấy đợt đăng ký nào" /> : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-neutral-50 text-xs font-bold tracking-wider text-slate-600 border-b border-neutral-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Tên đợt đăng ký</th>
                    <th className="py-3.5 px-4">Thời gian bắt đầu</th>
                    <th className="py-3.5 px-4">Thời gian kết thúc</th>
                    <th className="py-3.5 px-4 text-center">Trần tín chỉ</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-slate-800/80">
                  {paginatedPeriods.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-indigo-700 dark:text-indigo-400">{p.name}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{fmt(p.openAt)}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">{fmt(p.closeAt)}</td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-200">{p.maxCredits ?? 24} Tín chỉ</td>
                      <td className="py-3.5 px-4 text-center">
                        <Pill intent={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Đang mở' : 'Đã đóng'}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-200 dark:border-slate-800 pt-3 mt-3 px-2">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị <span className="font-bold text-slate-800 dark:text-slate-200">{page * pageSize + 1}</span> - <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min((page + 1) * pageSize, filteredPeriods.length)}</span> trên tổng số <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPeriods.length}</span> đợt
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
    </div>
  );
}
