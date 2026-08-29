// Admin Reports page - charts + export
import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import { PageTitle, Card, Spinner, ErrorBox } from '../../components/Layout';
import type { EnrollmentReport, ScoreReport } from '../../types';

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export default function AdminReports() {
  const [enrolls, setEnrolls] = useState<EnrollmentReport[]>([]);
  const [scores, setScores] = useState<ScoreReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'enroll' | 'score' | null>(null);

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

  const handleExportEnrollments = async () => {
    try {
      setExporting('enroll');
      const blob = await reportService.exportEnrollmentsExcel();
      downloadBlob(blob, 'enrollments-by-month.xlsx');
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'Không thể xuất báo cáo đăng ký.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportScores = async () => {
    try {
      setExporting('score');
      const blob = await reportService.exportScorePdf();
      downloadBlob(blob, 'average-score-by-class.pdf');
    } catch (error: unknown) {
      setErr((error as { message?: string })?.message ?? 'Không thể xuất báo cáo điểm trung bình.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div>
      <PageTitle>Báo cáo & Thống kê</PageTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={handleExportEnrollments}
          disabled={exporting !== null}
          className="px-3 py-2 rounded text-sm bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500"
        >
          {exporting === 'enroll' ? 'Đang xuất…' : 'Xuất Excel theo tháng'}
        </button>
        <button
          onClick={handleExportScores}
          disabled={exporting !== null}
          className="px-3 py-2 rounded text-sm bg-emerald-600 text-white disabled:opacity-50 hover:bg-emerald-500"
        >
          {exporting === 'score' ? 'Đang xuất…' : 'Xuất PDF điểm TB'}
        </button>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Đăng ký học theo tháng</h3>
          </div>
          <div className="space-y-2">
            {enrolls.map((e) => (
              <div key={e.month} className="flex items-center gap-2 text-sm">
                <div className="w-24 text-slate-400">{e.month}</div>
                <div className="min-w-0 flex-1 bg-slate-100 rounded h-6 overflow-hidden">
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
          </div>
          <div className="space-y-2">
            {scores.map((s) => (
              <div key={s.classId} className="flex items-center gap-2 text-sm">
                <div className="w-32 truncate text-slate-400">{s.classCode}</div>
                <div className="min-w-0 flex-1 bg-slate-100 rounded h-6 overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: `${(s.averageScore / maxScore) * 100}%` }} />
                </div>
                <div className="w-16 text-right font-mono">{s.averageScore.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
