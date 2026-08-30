// Student Transcript / GPA page
import { useEffect, useState } from 'react';
import * as reportService from '../../services/reportService';
import { PageTitle, Card, Spinner, Empty, Pill } from '../../components/Layout';
import type { AcademicStatus, TranscriptItem, GradingPolicy } from '../../types';
import * as profileService from '../../services/profileService';
import * as curriculumService from '../../services/curriculumService';

export default function StudentTranscript() {
  const [rows, setRows] = useState<TranscriptItem[]>([]);
  const [status, setStatus] = useState<AcademicStatus | null>(null);
  const [policy, setPolicy] = useState<GradingPolicy | null>(null);
  const [loading, setLoading] = useState(true);

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

  const warningText = status?.academicWarning
    ? `Cảnh báo học vụ${status.warningLevel != null ? ` (mức ${status.warningLevel})` : ''}`
    : 'Học tập ổn định';

  return (
    <div>
      <PageTitle>Bảng điểm (Transcript)</PageTitle>
      {policy !== undefined && (
        <div className="mb-4 rounded-lg bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-800 flex justify-between items-center shadow-sm">
          <span className="font-semibold text-blue-900">Trọng số tính điểm áp dụng:</span>
          <span className="font-medium">
            {policy
              ? `${Math.round(policy.attendanceWeight * 100)}% Chuyên cần + ${Math.round(policy.midtermWeight * 100)}% Giữa kỳ + ${Math.round(policy.finalWeight * 100)}% Cuối kỳ`
              : '40% Giữa kỳ + 60% Cuối kỳ'}
          </span>
        </div>
      )}
      {status && (
        <>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <Card><div className="text-xs text-slate-400">GPA tích luỹ</div><div className="text-2xl font-bold">{status.cumulativeGpa?.toFixed(2) ?? '—'}</div></Card>
            <Card><div className="text-xs text-slate-400">Tín chỉ đăng ký</div><div className="text-2xl font-bold">{status.totalCredits ?? 0}</div></Card>
            <Card><div className="text-xs text-slate-400">Tín chỉ đạt</div><div className="text-2xl font-bold text-emerald-600">{status.passedCredits ?? 0}</div></Card>
            <Card><div className="text-xs text-slate-400">Tình trạng</div><div className="mt-1 text-sm font-medium text-slate-700">{warningText}</div></Card>
          </div>

          <div className={`mb-4 rounded-lg border px-3 py-2 text-sm ${status.academicWarning ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {status.academicWarning ? `Cảnh báo học vụ (mức ${status.warningLevel ?? 1})` : 'Sinh viên đang ở trạng thái học tập bình thường.'}
          </div>
        </>
      )}

      <div className="grid lg:grid-cols-[1.7fr_0.9fr] gap-4">
        <Card>
          {rows.length === 0 ? <Empty msg="Chưa có dữ liệu" /> : (
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="text-left py-2">Mã môn học</th><th className="text-left">Tên môn</th>
                  <th>Tín chỉ</th><th>Điểm</th><th>GPA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.courseCode}-${i}`} className="border-b border-slate-800/50">
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

        <Card>
          <h3 className="mb-3 font-semibold">Môn học chưa đạt</h3>
          {status?.failedCourses && status.failedCourses.length > 0 ? (
            <div className="space-y-2 text-sm">
              {status.failedCourses.map((course, index) => (
                <div key={`${course.courseCode}-${index}`} className="rounded border border-rose-200 bg-rose-50 p-2">
                  <div className="font-medium text-slate-800">{course.courseTitle}</div>
                  <div className="mt-1 text-xs text-slate-500">{course.courseCode} · {course.credit} tín chỉ</div>
                  <div className="mt-1 text-xs text-rose-700">Điểm: {course.totalScore?.toFixed(1) ?? '—'}</div>
                </div>
              ))}
            </div>
          ) : (
            <Empty msg="Không có môn nào bị trượt" />
          )}
        </Card>
      </div>
    </div>
  );
}
