import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
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

  const exportToIcs = () => {
    if (schedules.length === 0) return;
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LearningHub//NONSGML Timetable//EN\n";
    schedules.forEach((s) => {
      const title = s.courseTitle || s.className || s.classCode || 'Lớp học phần';
      const room = s.room || 'Chưa xếp phòng';
      icsContent += `BEGIN:VEVENT\nSUMMARY:${title}\nLOCATION:${room}\nDESCRIPTION:Lớp: ${s.classCode ?? ''} - Giảng viên: ${s.lecturerName ?? ''}\nEND:VEVENT\n`;
    });
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'thoi_khoa_bieu_learninghub.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openGoogleCalendarSync = () => {
    if (schedules.length === 0) return;
    const first = schedules[0];
    const title = encodeURIComponent(first.courseTitle || first.className || 'Lớp học phần LearningHub');
    const location = encodeURIComponent(first.room || 'Phòng học LearningHub');
    const details = encodeURIComponent(`Lịch học các môn: ${schedules.map(s => s.courseTitle || s.classCode).join(', ')}`);
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&location=${location}&details=${details}`;
    window.open(googleUrl, '_blank');
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Thời khóa biểu cá nhân</PageTitle>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openGoogleCalendarSync}
            className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition shadow-sm"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
            </svg>
            Đồng bộ Google Calendar
          </button>
          <button
            type="button"
            onClick={exportToIcs}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
          >
            <Download className="h-4 w-4 text-slate-500" /> Tải file .ICS
          </button>
        </div>
      </div>
      <TimetableGrid schedules={schedules} title="Lịch cá nhân" />
    </div>
  );
}
