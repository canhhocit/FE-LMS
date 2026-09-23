import { useEffect, useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
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
    <div>
      <PageTitle>Quản lý Học phí & Định mức Tín chỉ</PageTitle>

      {err && <ErrorBox msg={err} />}
      {successMsg && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-xs font-semibold text-emerald-700 hover:underline">Đóng</button>
        </div>
      )}

      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => { setShowRateForm(!showRateForm); setShowGenForm(false); }}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-sm"
        >
          {showRateForm ? 'Hủy' : '+ Thêm định mức học phí mới'}
        </button>
        <button
          onClick={() => { setShowGenForm(!showGenForm); setShowRateForm(false); }}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 shadow-sm flex items-center gap-1.5"
        >
          {showGenForm ? 'Hủy' : <><Zap className="w-4 h-4" /> Sinh hóa đơn cho sinh viên</>}
        </button>
      </div>

      {showRateForm && (
        <Card className="mb-6 border-2 border-indigo-100">
          <h3 className="font-bold text-slate-800 mb-3 text-base">Thêm định mức tín chỉ mới</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Năm học</label>
              <input
                type="text"
                placeholder="VD: 2026-2027"
                value={rateForm.academicYear}
                onChange={(e) => setRateForm({ ...rateForm, academicYear: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Đơn giá / tín chỉ (VNĐ)</label>
              <input
                type="number"
                step="10000"
                value={rateForm.pricePerCredit}
                onChange={(e) => setRateForm({ ...rateForm, pricePerCredit: Number(e.target.value) })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 w-full cursor-pointer">
                <input
                  type="checkbox"
                  checked={rateForm.isActive}
                  onChange={(e) => setRateForm({ ...rateForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                />
                Áp dụng ngay
              </label>
            </div>
          </div>
          <button
            onClick={() => void handleCreateRate()}
            disabled={submittingRate}
            className="mt-4 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {submittingRate ? 'Đang lưu...' : 'Lưu định mức'}
          </button>
        </Card>
      )}

      {showGenForm && (
        <Card className="mb-6 border-2 border-emerald-100">
          <h3 className="font-bold text-slate-800 mb-3 text-base">Sinh hóa đơn học phí cho sinh viên</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Chọn sinh viên</label>
              <select
                value={genStudentId}
                onChange={(e) => setGenStudentId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              >
                <option value="">-- Chọn sinh viên --</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.studentCode ? `[${s.studentCode}] ` : ''}{s.fullName} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Học kỳ</label>
              <input
                type="text"
                value={genSemester}
                onChange={(e) => setGenSemester(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1 font-medium">Năm học</label>
              <input
                type="text"
                value={genYear}
                onChange={(e) => setGenYear(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            onClick={() => void handleGenerateInvoice()}
            disabled={submittingGen}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {submittingGen ? 'Đang sinh hóa đơn...' : 'Sinh hóa đơn ngay'}
          </button>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-lg mb-4">Các mức đơn giá tín chỉ trong hệ thống</h3>
        {rates.length === 0 ? (
          <Empty msg="Chưa có định mức học phí nào" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-600 border-b">
                <tr>
                  <th className="py-3 px-4 text-left">Năm học</th>
                  <th className="py-3 px-4 text-right">Đơn giá / tín chỉ</th>
                  <th className="py-3 px-4 text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800">{r.academicYear}</td>
                    <td className="py-3 px-4 text-right font-bold text-indigo-600">{fmtMoney(r.pricePerCredit)}</td>
                    <td className="py-3 px-4 text-center">
                      <Pill intent={r.isActive ? 'success' : 'neutral'}>
                        {r.isActive ? 'ĐANG ÁP DỤNG' : 'KHÔNG ÁP DỤNG'}
                      </Pill>
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
