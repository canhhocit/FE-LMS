import { useEffect, useState } from 'react';
import * as scheduleService from '../../services/scheduleService';
import { PageTitle, Spinner, ErrorBox } from '../../components/Layout';
import TimetableGrid from '../../components/TimetableGrid';
import type { Schedule } from '../../types';

export default function StudentSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let m = true;
    scheduleService.getMySchedule()
      .then((s) => m && setSchedules(s))
      .catch((e) => m && setErr((e as { message?: string })?.message ?? 'Lỗi tải thời khóa biểu'))
      .finally(() => m && setLoading(false));
    return () => { m = false; };
  }, []);

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-4">
      <PageTitle>Thời khóa biểu cá nhân</PageTitle>
      <TimetableGrid schedules={schedules} title="Lịch cá nhân" />
    </div>
  );
}
