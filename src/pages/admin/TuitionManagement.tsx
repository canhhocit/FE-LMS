import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader, Card, Button, Input, Select, Badge, Spinner, Empty, ErrorBox } from '../../components/ui';
import * as tuitionService from '../../services/tuitionService';
import type { TuitionRate } from '../../types';

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);
const today = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

interface RateForm {
  academicYear: string;
  semester: string;
  effectiveFrom: string;
  pricePerCredit: number;
  isActive: boolean;
}

const emptyRateForm = (): RateForm => ({
  academicYear: '2026-2027',
  semester: '',
  effectiveFrom: today(),
  pricePerCredit: 350000,
  isActive: true,
});

export default function AdminTuitionManagement() {
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [showRateForm, setShowRateForm] = useState(false);
  const [editingRate, setEditingRate] = useState<TuitionRate | null>(null);
  const [rateForm, setRateForm] = useState<RateForm>(emptyRateForm);
  const [submittingRate, setSubmittingRate] = useState(false);

  useEffect(() => {
    let mounted = true;
    tuitionService.getTuitionRates()
      .then((rateList) => {
        if (mounted) setRates(rateList);
      })
      .catch((loadError: unknown) => {
        if (mounted) setErr(loadError instanceof Error ? loadError.message : 'Không thể tải cấu hình học phí.');
      })
      .finally(() => {
        if (mounted) setRatesLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const reloadRates = async () => {
    setRatesLoading(true);
    setErr(null);
    try {
      setRates(await tuitionService.getTuitionRates());
    } catch (loadError: unknown) {
      setErr(loadError instanceof Error ? loadError.message : 'Không thể tải cấu hình học phí.');
    } finally {
      setRatesLoading(false);
    }
  };

  const openCreateRateForm = () => {
    setEditingRate(null);
    setRateForm(emptyRateForm());
    setShowRateForm((current) => !current);
    setErr(null);
  };

  const openEditRateForm = (rate: TuitionRate) => {
    setEditingRate(rate);
    setRateForm({
      academicYear: rate.academicYear,
      semester: rate.semester ?? '',
      effectiveFrom: rate.effectiveFrom,
      pricePerCredit: rate.pricePerCredit,
      isActive: rate.isActive,
    });
    setShowRateForm(true);
    setErr(null);
  };

  const handleSaveRate = async () => {
    if (!rateForm.academicYear.trim() || !rateForm.effectiveFrom) {
      setErr('Vui lòng nhập năm học và ngày bắt đầu áp dụng.');
      return;
    }
    if (!Number.isFinite(rateForm.pricePerCredit) || rateForm.pricePerCredit <= 0) {
      setErr('Đơn giá tín chỉ phải lớn hơn 0.');
      return;
    }

    setSubmittingRate(true);
    setErr(null);
    try {
      const payload = {
        ...rateForm,
        academicYear: rateForm.academicYear.trim(),
        semester: rateForm.semester || null,
      };
      if (editingRate) {
        await tuitionService.updateTuitionRate(editingRate.id, payload);
        setSuccessMsg('Đã cập nhật mức học phí.');
      } else {
        await tuitionService.createTuitionRate(payload);
        setSuccessMsg('Đã tạo mức học phí.');
      }
      setRates(await tuitionService.getTuitionRates());
      setShowRateForm(false);
      setEditingRate(null);
    } catch (saveError: unknown) {
      setErr(saveError instanceof Error ? saveError.message : 'Không lưu được mức học phí.');
    } finally {
      setSubmittingRate(false);
    }
  };

  const handleDeleteRate = async (rate: TuitionRate) => {
    const scope = rate.semester ? `${rate.academicYear} · ${rate.semester}` : `${rate.academicYear} · cả năm`;
    if (!window.confirm(`Xóa mức giá ${scope}, hiệu lực từ ${rate.effectiveFrom}? Hóa đơn đã tạo sẽ giữ nguyên đơn giá đã chốt.`)) return;
    setErr(null);
    try {
      await tuitionService.deleteTuitionRate(rate.id);
      setRates(await tuitionService.getTuitionRates());
      setSuccessMsg('Đã xóa mức học phí.');
    } catch (deleteError: unknown) {
      setErr(deleteError instanceof Error ? deleteError.message : 'Không xóa được mức học phí.');
    }
  };

  if (ratesLoading) return <Spinner />;

  const sortedRates = [...rates].sort((a, b) =>
    a.academicYear.localeCompare(b.academicYear) ||
    (a.semester ?? '').localeCompare(b.semester ?? '') ||
    a.effectiveFrom.localeCompare(b.effectiveFrom),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Quản lý học phí' }]}
        title="Quản lý học phí"
        subtitle="Thiết lập đơn giá theo năm học, học kỳ và ngày hiệu lực; sinh hóa đơn cho sinh viên."
        actions={
          <Button variant="primary" size="sm" onClick={openCreateRateForm}>
              <Plus className="w-4 h-4" />
              {showRateForm && !editingRate ? 'Đóng' : 'Thêm mức giá'}
          </Button>
        }
      />

      {err && <ErrorBox msg={err} onRetry={rates.length === 0 ? () => void reloadRates() : undefined} />}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {showRateForm && (
        <Card>
          <h3 className="mb-1 text-sm font-bold text-slate-900 dark:text-white">
            {editingRate ? 'Chỉnh sửa mức học phí' : 'Tạo mức học phí'}
          </h3>
          <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
            Mức theo học kỳ được ưu tiên hơn mức chung của năm học. Hóa đơn lấy mức đang hiệu lực tại ngày tạo.
          </p>
          <div className="grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-5">
            <Input
              label="Năm học *"
              placeholder="2026-2027"
              value={rateForm.academicYear}
              onChange={(e) => setRateForm({ ...rateForm, academicYear: e.target.value })}
            />
            <Select
              label="Phạm vi học kỳ"
              value={rateForm.semester}
              onChange={(e) => setRateForm({ ...rateForm, semester: e.target.value })}
              options={[
                { label: 'Mặc định cả năm', value: '' },
                { label: 'Học kỳ 1', value: 'HK1' },
                { label: 'Học kỳ 2', value: 'HK2' },
                { label: 'Học kỳ 3', value: 'HK3' },
              ]}
            />
            <Input
              label="Đơn giá / tín chỉ (VNĐ) *"
              type="number"
              min="1"
              value={rateForm.pricePerCredit}
              onChange={(e) => setRateForm({ ...rateForm, pricePerCredit: Number(e.target.value) })}
            />
            <Input
              label="Bắt đầu áp dụng từ *"
              type="date"
              value={rateForm.effectiveFrom}
              onChange={(e) => setRateForm({ ...rateForm, effectiveFrom: e.target.value })}
            />
            <Select
              label="Trạng thái"
              value={rateForm.isActive ? 'true' : 'false'}
              onChange={(e) => setRateForm({ ...rateForm, isActive: e.target.value === 'true' })}
              options={[
                { label: 'Đang áp dụng', value: 'true' },
                { label: 'Tạm khóa', value: 'false' },
              ]}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setShowRateForm(false); setEditingRate(null); }}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={() => void handleSaveRate()} disabled={submittingRate}>
              {submittingRate ? 'Đang lưu...' : editingRate ? 'Lưu thay đổi' : 'Lưu mức giá'}
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            <CalendarDays className="h-4 w-4 text-accent-600 dark:text-accent-400" />
            Bảng đơn giá học phí
          </h3>
          <Button variant="ghost" size="sm" onClick={() => void reloadRates()} disabled={ratesLoading}>Làm mới</Button>
        </div>
        {sortedRates.length === 0 ? (
          <Empty msg="Chưa có định mức học phí nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
                  <th className="px-4 py-3.5">Năm học</th>
                  <th className="px-4 py-3.5">Phạm vi</th>
                  <th className="px-4 py-3.5">Đơn giá / tín chỉ</th>
                  <th className="px-4 py-3.5">Ngày hiệu lực</th>
                  <th className="px-4 py-3.5 text-center">Trạng thái</th>
                  <th className="px-4 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800/60">
                {sortedRates.map((rate) => (
                  <tr key={rate.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3.5 font-semibold text-slate-900 dark:text-slate-100">{rate.academicYear}</td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{rate.semester || 'Mặc định cả năm'}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{fmtMoney(rate.pricePerCredit)}</td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">{rate.effectiveFrom}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge color={rate.isActive ? 'emerald' : 'slate'}>{rate.isActive ? 'Đang áp dụng' : 'Tạm khóa'}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditRateForm(rate)}>
                          <Pencil className="h-3.5 w-3.5" /> Sửa
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDeleteRate(rate)}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Xóa
                        </Button>
                      </div>
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
