// Student Transcript / GPA page
import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import type { AcademicStatus, TranscriptItem } from '../../types';

export default function StudentTranscript() {
  const [rows, setRows] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<AcademicStatus | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let m = true;
    Promise.all([reportService.getTranscript(), reportService.getAcademicStatus()])
      .then(([t, s]) => m && (setRows(t), setStatus(s)))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  return (
    <div>
      <PageTitle>Bảng điểm (Transcript)</PageTitle>
      {status && (
        <div className="grid md:grid-cols-4 gap-3 mb-4">
          <Card><div className="text-xs text-slate-400">GPA tích luỹ</div><div className="text-2xl font-bold">{status.cumulativeGpa?.toFixed(2) ?? '—'}</div></Card>
          <Card><div className="text-xs text-slate-400">Tín chỉ đăng ký</div><div className="text-2xl font-bold">{status.totalCredits}</div></Card>
          <Card><div className="text-xs text-slate-400">Tín chỉ đạt</div><div className="text-2xl font-bold text-emerald-600">{status.passedCredits}</div></Card>
        </div>
      )}
      {status?.academicWarning && (
        <div className="mb-4 border border-amber-200 bg-amber-50 text-amber-800 rounded-lg p-3 text-sm">
          Cảnh báo học vụ (mức {status.warningLevel})
        </div>
      )}
      <Card>
        {rows.length === 0 ? <Empty msg="Chưa có dữ liệu" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left py-2">Mã môn học</th><th className="text-left">Tên môn</th>
                <th>Tín chỉ</th><th>Điểm</th><th>GPA</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="font-mono text-indigo-300">{r.courseCode}</td>
                  <td>{r.courseTitle}</td>
                  <td className="text-center">{r.credit}</td>
                  <td className="text-center font-semibold">{r.totalScore?.toFixed(1) ?? '—'}</td>
                  <td className="text-center"><Pill color="indigo">{r.gpa?.toFixed(2) ?? '—'}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
