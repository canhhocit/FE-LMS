// Student Attendance page
import { useEffect, useState } from 'react';
import * as clazzService from '../../services/clazzService';
import * as gradingService from '../../services/gradingService';
import { PageTitle, Card, Spinner, Empty, ErrorBox, Pill } from '../../components/Layout';
import type { Clazz, AttendanceRecord } from '../../types';

const fmtDate = (s?: string) => s ? new Date(s).toLocaleDateString('vi-VN') : '—';

export default function StudentAttendance() {
  const [clazzes, setClazzes] = useState<Clazz[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [att, setAtt] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
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
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Lỗi'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  useEffect(() => {
    if (!selected) return;
    let m = true;
    gradingService.getMyAttendance(selected)
      .then((list) => m && setAtt(list ?? []))
      .catch((e: unknown) => m && setErr((e as { message?: string })?.message ?? 'Lỗi'));
    return () => { m = false; };
  }, [selected]);
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  const me = JSON.parse(localStorage.getItem('lms_auth') || '{}');
  const myRec = att.find((r) => r.studentId === me.id);
  return (
    <div>
      <PageTitle>Điểm danh của tôi</PageTitle>
      <div className="mb-3">
        <select value={selected ?? ''} onChange={(e) => setSelected(Number(e.target.value))}
          className="px-3 py-2 bg-white border border-slate-200 rounded-lg">
          {clazzes.map((c) => <option key={c.id} value={c.id}>{c.classCode} - {c.className}</option>)}
        </select>
      </div>
      <Card>
        <div className="grid md:grid-cols-3 gap-4">
          <div><div className="text-xs text-slate-400">Buổi gần nhất</div><div>{fmtDate(att[0]?.attendanceDate)}</div></div>
          <div><div className="text-xs text-slate-400">Trạng thái của tôi</div>
            <div>{myRec ? <Pill color={myRec.status === 'PRESENT' ? 'green' : myRec.status === 'LATE' ? 'amber' : 'red'}>{myRec.status}</Pill> : '-'}</div>
          </div>
          <div><div className="text-xs text-slate-400">Số bản ghi</div><div>{att.length} bản ghi</div></div>
        </div>
        {att.length > 0 && (
          <div className="mt-4 text-xs text-slate-400">Tổng hợp từ các buổi đã điểm danh của lớp.</div>
        )}
        {att.length === 0 && <Empty msg="Chưa có dữ liệu điểm danh" />}
      </Card>
    </div>
  );
}
