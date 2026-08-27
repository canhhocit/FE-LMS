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
          <Card><div className="text-xs text-slate-400">GPA học kỳ</div><div className="text-2xl font-bold">{status.gpa?.toFixed(2)}</div></Card>
          <Card><div className="text-xs text-slate-400">GPA tích luỹ</div><div className="text-2xl font-bold text-emerald-300">{status.cumulativeGpa?.toFixed(2)}</div></Card>
          <Card><div className="text-xs text-slate-400">Tín chỉ đăng ký</div><div className="text-2xl font-bold">{status.totalCredits}</div></Card>
          <Card><div className="text-xs text-slate-400">Tín chỉ đạt</div><div className="text-2xl font-bold text-cyan-300">{status.earnedCredits}</div></Card>
        </div>
      )}
      {status?.warningLevel && status.warningLevel !== 'NONE' && (
        <div className="mb-4 border border-amber-700/50 bg-amber-900/20 text-amber-200 rounded-lg p-3 text-sm">
          ⚠️ {status.message ?? 'Cảnh báo học vụ'}
        </div>
      )}
      <Card>
        {rows.length === 0 ? <Empty msg="Chưa có dữ liệu" /> : (
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-400 border-b border-slate-800">
              <tr>
                <th className="text-left py-2">Học kỳ</th><th className="text-left">Mã MH</th>
                <th className="text-left">Tên môn</th><th>TC</th><th>Điểm</th><th>Letter</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/50">
                  <td className="py-2 text-slate-400">{r.semester}</td>
                  <td className="font-mono text-indigo-300">{r.courseCode}</td>
                  <td>{r.courseName}</td>
                  <td className="text-center">{r.credits}</td>
                  <td className="text-center font-semibold">{r.score?.toFixed(1)}</td>
                  <td className="text-center"><Pill color="indigo">{r.letter}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
