// Admin Registration Periods page
import { useEffect, useState, useCallback } from 'react';
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

  return (
    <div>
      <PageTitle>Đợt đăng ký học phần</PageTitle>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-400">Quản lý các kỳ đăng ký cho sinh viên</div>
        <button onClick={() => setShowForm(!showForm)} className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-sm">
          {showForm ? 'Hủy' : '+ Tạo đợt mới'}
        </button>
      </div>
      {showForm && (
        <Card className="mb-3">
          {formError && (
            <div role="alert" aria-live="assertive" className="mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </div>
          )}
          <div className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-600">Tên đợt đăng ký <span className="text-rose-500">*</span></label>
              <input aria-label="Tên đợt đăng ký" required placeholder="VD: Đợt đăng ký học phần HK1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-600">Học kỳ</label>
              <input aria-label="Học kỳ" placeholder="HK1 / HK2 / HK3" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-600">Năm học</label>
              <input aria-label="Năm học" placeholder="VD: 2026-2027" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-600">Thời gian bắt đầu mở đợt <span className="text-rose-500">*</span></label>
              <input aria-label="Thời gian bắt đầu" required type="datetime-local" value={form.openAt} onChange={(e) => setForm({ ...form, openAt: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-600">Thời gian kết thúc (Hạn đóng đợt & Hạn học phí) <span className="text-rose-500">*</span></label>
              <input aria-label="Thời gian kết thúc" required type="datetime-local" value={form.closeAt} onChange={(e) => setForm({ ...form, closeAt: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block mb-1 text-xs font-medium text-slate-600">Số tín chỉ tối đa (Trần tín chỉ)</label>
              <input aria-label="Số tín chỉ tối đa" type="number" min="1" placeholder="Số tín chỉ tối đa (Mặc định 24)" value={form.maxCredits} onChange={(e) => setForm({ ...form, maxCredits: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 cursor-pointer">
                <input
                  aria-label="Mở ngay cho sinh viên đăng ký"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Mở ngay đợt đăng ký này cho sinh viên</span>
              </label>
            </div>
          </div>
          <button onClick={submit} disabled={submitting} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? 'Đang tạo...' : 'Tạo'}
          </button>
        </Card>
      )}
      <Card>
        {periods.length === 0 ? <Empty msg="Chưa có đợt đăng ký" /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-600 border-b border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Tên đợt</th>
                  <th className="py-3 px-4">Bắt đầu</th>
                  <th className="py-3 px-4">Kết thúc</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {periods.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-100">{p.name}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{fmt(p.openAt)}</td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{fmt(p.closeAt)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Pill intent={p.isActive ? 'success' : 'neutral'}>{p.isActive ? 'Đang mở' : 'Đã đóng'}</Pill>
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
