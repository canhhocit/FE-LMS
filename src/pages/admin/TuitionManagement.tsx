import { useEffect, useState, useCallback } from 'react';
import { DollarSign, Plus, Zap, CheckCircle2 } from 'lucide-react';
import { PageHeader, Card, Button, Input, Select, Badge, Spinner, Empty, ErrorBox } from '../../components/ui';
import * as tuitionService from '../../services/tuitionService';
import * as adminService from '../../services/adminService';
import type { TuitionRate, User } from '../../types';

const fmtMoney = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v);

export default function AdminTuitionManagement() {
  const [rates, setRates] = useState<TuitionRate[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Rate Form
  const [showRateForm, setShowRateForm] = useState(false);
  const [rateForm, setRateForm] = useState({ academicYear: '2026-2027', pricePerCredit: 350000, isActive: true });
  const [submittingRate, setSubmittingRate] = useState(false);

  // Invoice Generation Form
  const [showGenForm, setShowGenForm] = useState(false);
  const [genStudentId, setGenStudentId] = useState<string>('');
  const [genSemester, setGenSemester] = useState<string>('HK1');
  const [genYear, setGenYear] = useState<string>('2026-2027');
  const [submittingGen, setSubmittingGen] = useState(false);

  const loadData = useCallback(() => {
    let mounted = true;
    Promise.all([
      tuitionService.getTuitionRates(),
      adminService.listStudents(''),
    ])
      .then(([rateList, studentList]) => {
        if (!mounted) return;
        setRates(rateList);
        setStudents(studentList);
      })
      .catch((e: unknown) => {
        if (!mounted) return;
        setErr((e as { message?: string })?.message ?? 'Lỗi tải dữ liệu học phí');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const cleanup = loadData();
    return cleanup;
  }, [loadData]);

  const handleCreateRate = async () => {
    if (!rateForm.academicYear.trim()) {
      setErr('Vui lòng nhập năm học');
      return;
    }
    if (rateForm.pricePerCredit <= 0) {
      setErr('Đơn giá tín chỉ phải lớn hơn 0');
      return;
    }
    setSubmittingRate(true);
    setErr(null);
    try {
      await tuitionService.createTuitionRate(rateForm);
      setSuccessMsg(`Đã tạo mức học phí cho năm học ${rateForm.academicYear}`);
      setShowRateForm(false);
      loadData();
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không tạo được mức học phí');
    } finally {
      setSubmittingRate(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!genStudentId) {
      setErr('Vui lòng chọn sinh viên');
      return;
    }
    setSubmittingGen(true);
    setErr(null);
    try {
      const inv = await tuitionService.generateInvoice(Number(genStudentId), genSemester, genYear);
      setSuccessMsg(`Đã sinh hóa đơn cho sinh viên! Tổng tiền: ${fmtMoney(inv.amount)} (${inv.totalCredits} tín chỉ)`);
      setShowGenForm(false);
    } catch (e: unknown) {
      setErr((e as { message?: string })?.message ?? 'Không sinh được hóa đơn học phí');
    } finally {
      setSubmittingGen(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        breadcrumbs={[{ label: 'Quản trị hệ thống', to: '/admin' }, { label: 'Quản lý Học phí' }]}
        title="Quản lý Học phí & Định mức Tín chỉ"
        subtitle="Thiết lập đơn giá học phí tín chỉ theo năm học và sinh tự động hóa đơn học phí cho sinh viên"
        actions={
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={() => { setShowGenForm(!showGenForm); setShowRateForm(false); }}>
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              {showGenForm ? 'Đóng form' : 'Sinh hóa đơn SV'}
            </Button>
            <Button variant="primary" size="sm" onClick={() => { setShowRateForm(!showRateForm); setShowGenForm(false); }}>
              <Plus className="w-4 h-4" />
              {showRateForm ? 'Đóng form' : 'Thêm mức học phí'}
            </Button>
          </div>
        }
      />

      {err && <ErrorBox message={err} />}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          {successMsg}
        </div>
      )}

      {showRateForm && (
        <Card className="border border-navy-200 dark:border-navy-800">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm">Thêm Mức Đơn giá Học phí Tín chỉ Nối tiếp</h3>
          <div className="grid gap-4 text-xs sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Năm học *</label>
              <Input
                placeholder="VD: 2026-2027"
                value={rateForm.academicYear}
                onChange={(e) => setRateForm({ ...rateForm, academicYear: e.target.value })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Giá mỗi tín chỉ (VNĐ) *</label>
              <Input
                type="number"
                value={rateForm.pricePerCredit}
                onChange={(e) => setRateForm({ ...rateForm, pricePerCredit: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Trạng thái</label>
              <Select
                value={rateForm.isActive ? 'true' : 'false'}
                onChange={(e) => setRateForm({ ...rateForm, isActive: e.target.value === 'true' })}
                options={[
                  { label: 'Kích hoạt ngay (Active)', value: 'true' },
                  { label: 'Không kích hoạt (Inactive)', value: 'false' },
                ]}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowRateForm(false)}>Hủy</Button>
            <Button variant="primary" size="sm" onClick={handleCreateRate} disabled={submittingRate}>
              {submittingRate ? 'Đang lưu...' : 'Lưu mức học phí'}
            </Button>
          </div>
        </Card>
      )}

      {showGenForm && (
        <Card className="border-2 border-amber-200 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/20">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            Sinh Tự động Hóa đơn Học phí cho Sinh viên
          </h3>
          <div className="grid gap-4 text-xs sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Chọn Sinh viên *</label>
              <Select
                value={genStudentId}
                onChange={(e) => setGenStudentId(e.target.value)}
                options={[
                  { label: '-- Chọn sinh viên --', value: '' },
                  ...students.map(s => ({ label: `${s.fullName} (${s.studentCode || s.email})`, value: String(s.id) }))
                ]}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Học kỳ</label>
              <Input
                value={genSemester}
                onChange={(e) => setGenSemester(e.target.value)}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Năm học</label>
              <Input
                value={genYear}
                onChange={(e) => setGenYear(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setShowGenForm(false)}>Hủy</Button>
            <Button variant="warning" size="sm" onClick={handleGenerateInvoice} disabled={submittingGen}>
              {submittingGen ? 'Đang sinh...' : 'Sinh hóa đơn'}
            </Button>
          </div>
        </Card>
      )}

      <Card padding="none">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-navy-700 dark:text-navy-300" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Bảng Đơn giá Tín chỉ đã Cấu hình
            </h3>
          </div>
        </div>

        {rates.length === 0 ? (
          <Empty msg="Chưa có định mức học phí nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">#</th>
                  <th className="py-3.5 px-4">Năm học</th>
                  <th className="py-3.5 px-4">Đơn giá / 1 Tín chỉ (VNĐ)</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái áp dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {rates.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">{r.academicYear}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-navy-900 dark:text-navy-300">{fmtMoney(r.pricePerCredit)}</td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={r.isActive ? 'success' : 'neutral'}>
                        {r.isActive ? 'Đang áp dụng' : 'Khóa'}
                      </Badge>
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
