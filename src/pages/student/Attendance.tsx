import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import * as clazzService from '../../services/clazzService';
import * as gradingService from '../../services/gradingService';
import { PageHeader, Card, StatCard, Select, Spinner, Empty, ErrorBox, Badge, Table } from '../../components/ui';
import type { Clazz, AttendanceRecord } from '../../types';

const fmtDate = (s?: string) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

const statusMeta: Record<string, { label: string; color: 'emerald' | 'amber' | 'rose' | 'slate' }> = {
  PRESENT: { label: 'Có mặt', color: 'emerald' },
  LATE:    { label: 'Đến muộn', color: 'amber' },
  ABSENT:  { label: 'Vắng mặt', color: 'rose' },
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
    <div className="space-y-6">
      <PageHeader
        title="Điểm danh của tôi"
        subtitle="Theo dõi lịch sử và tỷ lệ chuyên cần từng lớp học phần"
      />

      {clazzes.length === 0 ? (
        <Empty msg="Bạn chưa đăng ký lớp học phần nào" />
      ) : (
        <>
          <div className="max-w-md">
            <Select
              label="Chọn lớp học phần"
              value={selected ?? ''}
              onChange={(e) => setSelected(Number(e.target.value))}
            >
              {clazzes.map((c) => (
                <option key={c.id} value={c.id}>{c.classCode} — {c.className}</option>
              ))}
            </Select>
          </div>

          {totalSessions > 0 && (
            <div className="grid gap-3 sm:grid-cols-4">
              <StatCard label="Tổng số buổi" value={totalSessions} color="sky" />
              <StatCard label="Có mặt" value={presentCount} color="emerald" />
              <StatCard label="Đến muộn" value={lateCount} color="amber" />
              <StatCard label="Vắng mặt" value={absentCount} color="rose" />
            </div>
          )}

          {attendanceRate !== null && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tỷ lệ chuyên cần</span>
                <span className={`text-sm font-bold ${attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${attendanceRate >= 80 ? 'bg-emerald-500' : attendanceRate >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                  style={{ width: `${attendanceRate}%` }}
                />
              </div>
              {absentCount / totalSessions > 0.2 && (
                <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Tỷ lệ vắng mặt vượt 20% — có thể ảnh hưởng đến điều kiện thi và điểm tổng kết.</span>
                </div>
              )}
            </Card>
          )}

          {loadingAtt ? (
            <Spinner />
          ) : att.length === 0 ? (
            <Empty msg="Chưa có dữ liệu điểm danh cho lớp này" />
          ) : (
            <Table headers={['STT', 'Ngày học', 'Trạng thái']}>
              {att.map((record, idx) => {
                const meta = statusMeta[record.status] ?? { label: record.status, color: 'slate' as const };
                return (
                  <tr key={record.id ?? idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-xs">{fmtDate(record.attendanceDate)}</td>
                    <td className="px-4 py-3">
                      <Badge color={meta.color}>{meta.label}</Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
