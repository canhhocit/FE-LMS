// Admin Registration Periods page
import { useEffect, useState, useCallback } from 'react';
import * as registrationService from '../../services/registrationService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { RegistrationPeriod } from '../../types';

const fmt = (s?: string) => s ? new Date(s).toLocaleString('vi-VN') : '—';

export default function RegistrationPeriods() {
  const [periods, setPeriods] = useState<RegistrationPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', semester: 'HK1', academicYear: '2026-2027', openAt: '', closeAt: '', maxCredits: '24' });
  // Wrapping the loader in useCallback keeps the reference stable across renders
  // and lets the effect depend on it explicitly. setState is only called from
  // async callbacks to avoid the "set-state-in-effect" lint warning.
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
  const submit = async () => {
    try {
      await registrationService.createRegistrationPeriod({ ...form, maxCredits: Number(form.maxCredits), isActive: false });
      setShowForm(false);
      setForm({ name: '', semester: 'HK1', academicYear: '2026-2027', openAt: '', closeAt: '', maxCredits: '24' });
      load();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Lỗi');
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
          <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <input required placeholder="Tên đợt" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
            <input placeholder="Học kỳ (VD: HK1)" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
            <input placeholder="Năm học (VD: 2026-2027)" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
            <input required type="datetime-local" value={form.openAt} onChange={(e) => setForm({ ...form, openAt: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
            <input required type="datetime-local" value={form.closeAt} onChange={(e) => setForm({ ...form, closeAt: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
            <input type="number" min="0" placeholder="Tín chỉ tối đa" value={form.maxCredits} onChange={(e) => setForm({ ...form, maxCredits: e.target.value })}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg" />
          </div>
          <button onClick={submit} className="mt-3 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm">Tạo</button>
        </Card>
      )}
      <Card>
        {periods.length === 0 ? <Empty msg="Chưa có đợt đăng ký" /> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr><th className="text-left py-2">Tên đợt</th><th>Bắt đầu</th><th>Kết thúc</th><th>Trạng thái</th></tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.id} className="border-b border-slate-800/50">
                  <td className="py-2 font-medium">{p.name}</td>
                  <td>{fmt(p.openAt)}</td>
                  <td>{fmt(p.closeAt)}</td>
                  <td><Pill color={p.isActive ? 'green' : 'slate'}>{p.isActive ? 'Đang mở' : 'Đã đóng'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </Card>
    </div>
  );
}
