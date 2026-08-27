// Student Schedule page
import { useEffect, useState } from 'react';
import * as scheduleService from '../../services/scheduleService';
import { PageTitle, Card, Spinner, Empty, ErrorBox } from '../../components/Layout';
import type { Schedule } from '../../types';

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

export default function StudentSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let m = true;
    scheduleService.getMySchedule()
      .then((s) => m && setSchedules(s))
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Lỗi'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);
  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;
  const days = Array.from(new Set(schedules.map((s) => s.dayOfWeek))).sort();
  return (
    <div>
      <PageTitle>Thời khoá biểu</PageTitle>
      {schedules.length === 0 ? <Empty msg="Chưa có thời khoá biểu" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3">
          {days.map((d) => (
            <Card key={d}>
              <h3 className="font-semibold mb-3 text-indigo-300">{DAY_NAMES[d] ?? `Ngày ${d}`}</h3>
              <ul className="space-y-2 text-sm">
                {schedules.filter((s) => s.dayOfWeek === d).map((s) => (
                  <li key={s.id} className="border-l-2 border-indigo-500 pl-2">
                    <div className="font-mono text-indigo-200">{s.startTime} - {s.endTime}</div>
                    <div className="font-medium">{s.classCode} - {s.className}</div>
                    <div className="text-xs text-slate-400">Phòng: {s.room ?? '-'}</div>
                    {s.lecturerName && <div className="text-xs text-slate-500">GV: {s.lecturerName}</div>}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
