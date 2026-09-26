import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import * as reportService from '../../services/reportService';
import { PageHeader, Card, StatCard, Spinner, Empty, Badge, Button, Table } from '../../components/ui';
import type { AcademicStatus, TranscriptItem, GradingPolicy } from '../../types';
import * as profileService from '../../services/profileService';
import * as curriculumService from '../../services/curriculumService';

export default function StudentTranscript() {
  const [rows, setRows] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<AcademicStatus | null>(null);
  const [policy, setPolicy] = useState<GradingPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      const blob = await reportService.exportScorePdf();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bang_Diem_Sinh_Vien_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (_) {
      alert('Không thể tải PDF bảng điểm lúc này. Vui lòng thử lại sau.');
    } finally {
      setDownloading(false);
    }
  };

  useEffect(() => {
    let m = true;
    Promise.all([
      reportService.getTranscript(),
      reportService.getAcademicStatus(),
      profileService.getMyProfile().then((prof) => {
        if (prof?.curriculumId) {
          return curriculumService.getGradingPolicyPublic(prof.curriculumId).catch(() => null);
        }
        return null;
      }).catch(() => null)
    ])
      .then(([t, s, p]) => {
        if (m) {
          setRows(t);
          setStatus(s);
          setPolicy(p);
        }
      })
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bảng điểm tích lũy"
        subtitle="Tổng hợp điểm môn học, GPA tích lũy và số tín chỉ hoàn thành"
        actions={
          <Button onClick={handleDownloadPdf} loading={downloading}>
            <Download className="w-3.5 h-3.5" />
            <span>Tải Bảng điểm PDF</span>
          </Button>
        }
      />

      {policy && (
        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center text-slate-700 dark:text-slate-300">
          <span className="font-semibold">Trọng số tính điểm:</span>
          <span>
            {Math.round(policy.attendanceWeight * 100)}% Chuyên cần + {Math.round(policy.midtermWeight * 100)}% Giữa kỳ + {Math.round(policy.finalWeight * 100)}% Cuối kỳ
          </span>
        </div>
      )}

      {status && (
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard label="GPA tích lũy" value={status.cumulativeGpa?.toFixed(2) ?? '—'} color="emerald" />
          <StatCard label="Tín chỉ đăng ký" value={status.totalCredits ?? 0} color="sky" />
          <StatCard label="Tín chỉ đạt" value={status.passedCredits ?? 0} color="accent" />
          <StatCard label="Tình trạng" value={status.academicWarning ? `Cảnh báo (mức ${status.warningLevel ?? 1})` : 'Bình thường'} color={status.academicWarning ? 'rose' : 'emerald'} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {rows.length === 0 ? (
            <Empty msg="Chưa có dữ liệu bảng điểm" />
          ) : (
            <Table headers={['Mã môn học', 'Tên môn học', 'Tín chỉ', 'Điểm tổng kết', 'GPA']}>
              {rows.map((r, i) => (
                <tr key={`${r.courseCode}-${i}`} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3 font-mono font-semibold text-accent-600 dark:text-accent-400 text-xs">{r.courseCode}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">{r.courseTitle}</td>
                  <td className="px-4 py-3 text-center text-xs">{r.credit}</td>
                  <td className="px-4 py-3 text-center font-bold text-slate-900 dark:text-white text-xs">{r.totalScore?.toFixed(1) ?? '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge color="indigo">{r.gpa?.toFixed(2) ?? '—'}</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </div>

        <Card>
          <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider mb-3">Môn học chưa đạt</h3>
          {status?.failedCourses && status.failedCourses.length > 0 ? (
            <div className="space-y-2">
              {status.failedCourses.map((course, index) => (
                <div key={`${course.courseCode}-${index}`} className="p-3 rounded-lg border border-rose-200 bg-rose-50/70 dark:border-rose-900/60 dark:bg-rose-950/40 text-xs">
                  <div className="font-bold text-rose-900 dark:text-rose-200">{course.courseTitle}</div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-1">{course.courseCode} · {course.credit} tín chỉ</div>
                  <div className="text-[11px] font-semibold text-rose-800 dark:text-rose-200 mt-1">Điểm: {course.totalScore?.toFixed(1) ?? '—'}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty msg="Không có môn học nào bị trượt" />
          )}
        </Card>
      </div>
    </div>
  );
}
