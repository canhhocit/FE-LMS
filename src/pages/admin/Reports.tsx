// Admin Reports page - charts + export
import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import { PageTitle, Card, Spinner, ErrorBox } from '../../components/Layout';
import type { EnrollmentReport, ScoreReport } from '../../types';

const downloadBlob = (b: Blob, name: string) => {
  const url = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

export default function AdminReports() {
  const [enrolls, setEnrolls] = useState<EnrollmentReport[]>([]);
  const [scores, setScores] = useState<ScoreReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let m = true;
    Promise.all([reportService.getEnrollmentsByMonth(), reportService.getAverageScoreByClazz()])
      .then(([e, s]) => m && (setEnrolls(e), setScores(s)))
      .catch((e2) => m && setErr((e2 as { message?: string })?.message ?? 'Lỗi'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  const maxEnroll = Math.max(...enrolls.map((e) => e.count), 1);
  const maxScore = 10;
  const exportExcel = async () => {
    const b = await reportService.exportEnrollmentsExcel();
    downloadBlob(b, `enrollments-${Date.now()}.csv`);
  };
  const exportPdf = async () => {
    const b = await reportService.exportScorePdf();
    downloadBlob(b, `scores-${Date.now()}.pdf`);
  };
  return (
    <div>
      <PageTitle>Báo cáo & Thống kê</PageTitle>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Đăng ký học theo tháng</h3>
            <button onClick={exportExcel} className="text-xs px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500">
              ⬇ Excel
            </button>
          </div>
          <div className="space-y-2">
            {enrolls.map((e) => (
              <div key={e.month} className="flex items-center gap-2 text-sm">
                <div className="w-24 text-slate-400">{e.month}</div>
                <div className="flex-1 bg-slate-800 rounded h-6 overflow-hidden">
                  <div className="bg-indigo-500 h-full" style={{ width: `${(e.count / maxEnroll) * 100}%` }} />
                </div>
                <div className="w-16 text-right font-mono">{e.count}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Điểm TB theo lớp</h3>
            <button onClick={exportPdf} className="text-xs px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500">
              ⬇ PDF
            </button>
          </div>
          <div className="space-y-2">
            {scores.map((s) => (
              <div key={s.classId} className="flex items-center gap-2 text-sm">
                <div className="w-32 truncate text-slate-400">{s.classCode}</div>
                <div className="flex-1 bg-slate-800 rounded h-6 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(s.averageScore / maxScore) * 100}%` }} />
                </div>
                <div className="w-16 text-right font-mono">{s.averageScore.toFixed(2)}</div>
                <div className="w-14 text-right text-xs text-slate-500">{s.studentCount} SV</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
