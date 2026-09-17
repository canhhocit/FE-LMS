// Student Attendance page - full per-session view
import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import * as clazzService from '../../services/clazzService';
import * as gradingService from '../../services/gradingService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Clazz, AttendanceRecord } from '../../types';

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const statusMeta: Record<string, { label: string; intent: 'success' | 'warn' | 'error' | 'neutral' }> = {
  PRESENT: { label: 'Có mặt', intent: 'success' },
  LATE:    { label: 'Đến muộn', intent: 'warn' },
  ABSENT:  { label: 'Vắng mặt', intent: 'error' },
};

export default function StudentAttendance() {
  const [clazzes, setClazzes] = useState<Clazz[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [att, setAtt] = useState<AttendanceRecord[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingAtt, setLoadingAtt] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let m = true;
    clazzService.getMyClasses()
      .then((c) => {
        if (m) {
          setClazzes(c);
          if (c.length > 0) setSelected(c[0].id);
        }
      })
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Không thể tải danh sách lớp'))
      .finally(() => m && setLoadingClasses(false));
    return () => { m = false; };
  }, []);

  useEffect(() => {
    if (!selected) return;
    let m = true;
    setLoadingAtt(true);
    setErr(null);
    gradingService.getMyAttendance(selected)
      .then((list) => m && setAtt(list ?? []))
      .catch((e: unknown) => m && setErr((e as { message?: string })?.message ?? 'Không thể tải điểm danh'))
      .finally(() => m && setLoadingAtt(false));
    return () => { m = false; };
  }, [selected]);

  const presentCount = att.filter((r) => r.status === 'PRESENT').length;
  const lateCount    = att.filter((r) => r.status === 'LATE').length;
  const absentCount  = att.filter((r) => r.status === 'ABSENT').length;
  const totalSessions = att.length;
  const attendanceRate = totalSessions > 0
    ? Math.round(((presentCount + lateCount * 0.5) / totalSessions) * 100)
    : null;

  if (loadingClasses) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-5">
      <PageTitle>Điểm danh của tôi</PageTitle>

      {/* Class selector */}
      {clazzes.length === 0 ? (
        <Empty msg="Bạn chưa đăng ký lớp học nào" />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Chọn lớp:</label>
            <select
              value={selected ?? ''}
              onChange={(e) => setSelected(Number(e.target.value))}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl shadow-xs dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            >
              {clazzes.map((c) => (
                <option key={c.id} value={c.id}>{c.classCode} — {c.className}</option>
              ))}
            </select>
          </div>

          {/* Stats summary */}
          {totalSessions > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card className="text-center">
                <div className="text-xs text-slate-400 mb-1">Tổng buổi</div>
                <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalSessions}</div>
              </Card>
              <Card className="text-center">
                <div className="text-xs text-emerald-500 mb-1">Có mặt</div>
                <div className="text-2xl font-bold text-emerald-600">{presentCount}</div>
              </Card>
              <Card className="text-center">
                <div className="text-xs text-amber-500 mb-1">Đến muộn</div>
                <div className="text-2xl font-bold text-amber-600">{lateCount}</div>
              </Card>
              <Card className="text-center">
                <div className="text-xs text-rose-500 mb-1">Vắng mặt</div>
                <div className="text-2xl font-bold text-rose-600">{absentCount}</div>
              </Card>
            </div>
          )}

          {/* Attendance rate bar */}
          {attendanceRate !== null && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tỷ lệ chuyên cần</span>
                <span className={`text-sm font-bold ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              {absentCount / totalSessions > 0.2 && (
                <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Tỷ lệ vắng mặt vượt 20% — có thể ảnh hưởng đến điểm và tư cách dự thi.
                </p>
              )}
            </Card>
          )}

          {/* Per-session table */}
          {loadingAtt ? (
            <Spinner />
          ) : att.length === 0 ? (
            <Empty msg="Chưa có dữ liệu điểm danh cho lớp này" />
          ) : (
            <Card>
              <h3 className="font-semibold text-slate-800 dark:text-white mb-3">Chi tiết từng buổi</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">STT</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Ngày</th>
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {att.map((record, idx) => {
                      const meta = statusMeta[record.status] ?? { label: record.status, intent: 'neutral' as const };
                      return (
                        <tr key={record.id ?? idx} className="border-b border-slate-50 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">{fmtDate(record.attendanceDate)}</td>
                          <td className="py-2 px-3">
                            <Pill intent={meta.intent}>{meta.label}</Pill>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
