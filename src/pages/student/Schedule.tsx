import { useEffect, useState } from 'react';
import { Download, Calendar, ExternalLink, CalendarPlus } from 'lucide-react';
import * as scheduleService from '../../services/scheduleService';
import { PageHeader, Spinner, ErrorBox, Button, Modal, Toast } from '../../components/ui';
import TimetableGrid from '../../components/TimetableGrid';
import type { Schedule } from '../../types';

const DAY_NAMES = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

const PERIOD_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '06:45', end: '07:30' },
  2: { start: '07:40', end: '08:25' },
  3: { start: '08:35', end: '09:25' },
  4: { start: '09:30', end: '10:15' },
  5: { start: '10:25', end: '11:10' },
  6: { start: '11:20', end: '12:10' },
  7: { start: '12:30', end: '13:15' },
  8: { start: '13:25', end: '14:10' },
  9: { start: '14:20', end: '15:10' },
  10: { start: '15:15', end: '16:00' },
  11: { start: '16:10', end: '16:55' },
  12: { start: '17:05', end: '17:55' },
};

function getNextDateForDayOfWeek(targetDayOfWeek: number): Date {
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 7 : now.getDay();
  let diff = targetDayOfWeek - currentDay;
  if (diff < 0) {
    diff += 7;
  }
  const nextDate = new Date(now);
  nextDate.setDate(now.getDate() + diff);
  return nextDate;
}

function buildGoogleCalendarUrl(schedule: Schedule): string {
  const dayNum = schedule.dayOfWeek || 1;
  const nextDate = getNextDateForDayOfWeek(dayNum);

  const startP = schedule.startPeriod || 1;
  const endP = schedule.endPeriod || (startP + 2);

  const startTimeStr = schedule.startTime && schedule.startTime !== '00:00' ? schedule.startTime : (PERIOD_TIMES[startP]?.start || '06:45');
  const endTimeStr = schedule.endTime && schedule.endTime !== '00:00' ? schedule.endTime : (PERIOD_TIMES[endP]?.end || '12:10');

  const [sh, sm] = startTimeStr.split(':').map(Number);
  const [eh, em] = endTimeStr.split(':').map(Number);

  const startDateObj = new Date(nextDate);
  startDateObj.setHours(sh || 6, sm || 45, 0, 0);

  const endDateObj = new Date(nextDate);
  endDateObj.setHours(eh || 12, em || 10, 0, 0);

  const formatIso = (d: Date) => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };

  const startIso = formatIso(startDateObj);
  const endIso = formatIso(endDateObj);

  const title = encodeURIComponent(`[LMS] ${schedule.courseTitle || schedule.className || schedule.classCode || 'Lịch học'}`);
  const location = encodeURIComponent(schedule.room ? `Phòng ${schedule.room}` : 'Phòng học LearningHub');
  const details = encodeURIComponent(
    `Môn học: ${schedule.courseTitle || schedule.className}\nMã lớp: ${schedule.classCode ?? ''}\nGiảng viên: ${schedule.lecturerName ?? 'Chưa cập nhật'}\nTiết: ${startP}-${endP} (${startTimeStr} - ${endTimeStr})\nHệ thống LearningHub LMS`
  );

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&recur=RRULE:FREQ=WEEKLY;COUNT=15&ctz=Asia/Ho_Chi_Minh`;
}

function buildIcsContent(schedules: Schedule[]): string {
  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//LearningHub//LMS Timetable//VN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\n";

  schedules.forEach((s, idx) => {
    const dayNum = s.dayOfWeek || 1;
    const nextDate = getNextDateForDayOfWeek(dayNum);
    const startP = s.startPeriod || 1;
    const endP = s.endPeriod || (startP + 2);

    const startTimeStr = s.startTime && s.startTime !== '00:00' ? s.startTime : (PERIOD_TIMES[startP]?.start || '06:45');
    const endTimeStr = s.endTime && s.endTime !== '00:00' ? s.endTime : (PERIOD_TIMES[endP]?.end || '12:10');

    const [sh, sm] = startTimeStr.split(':').map(Number);
    const [eh, em] = endTimeStr.split(':').map(Number);

    const startDateObj = new Date(nextDate);
    startDateObj.setHours(sh || 6, sm || 45, 0, 0);

    const endDateObj = new Date(nextDate);
    endDateObj.setHours(eh || 12, em || 10, 0, 0);

    const formatIcsDate = (d: Date) => {
      const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
      return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
    };

    const dtStart = formatIcsDate(startDateObj);
    const dtEnd = formatIcsDate(endDateObj);
    const title = s.courseTitle || s.className || s.classCode || 'Môn học LMS';
    const room = s.room ? `Phòng ${s.room}` : 'Trực tuyến';
    const desc = `Lớp: ${s.classCode ?? ''} - GV: ${s.lecturerName ?? ''} - Tiết ${startP}-${endP}`;

    ics += `BEGIN:VEVENT\nUID:lms-schedule-${s.id || idx}-${Date.now()}@learninghub.edu.vn\nDTSTAMP:${formatIcsDate(new Date())}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nRRULE:FREQ=WEEKLY;COUNT=15\nSUMMARY:[LMS] ${title}\nLOCATION:${room}\nDESCRIPTION:${desc}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
  });

  ics += "END:VCALENDAR";
  return ics;
}

export default function StudentSchedule() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

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
    const icsContent = buildIcsContent(schedules);

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'thoi_khoa_bieu_learninghub.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToastMsg('Đã tải file .ICS toàn bộ lịch học!');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDirectSyncAllGoogleCalendar = () => {
    if (schedules.length === 0) return;

    const uniqueMap = new Map<string, Schedule>();
    schedules.forEach((s) => {
      const key = `${s.classCode || s.className}_${s.dayOfWeek}_${s.startPeriod}`;
      if (!uniqueMap.has(key)) uniqueMap.set(key, s);
    });

    const uniqueSchedules = Array.from(uniqueMap.values());
    uniqueSchedules.forEach((s, idx) => {
      const url = buildGoogleCalendarUrl(s);
      setTimeout(() => {
        window.open(url, '_blank');
      }, idx * 350);
    });

    setToastMsg(`Đã mở ${uniqueSchedules.length} trang Google Calendar để lưu trực tiếp!`);
    setTimeout(() => setToastMsg(null), 6000);
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-6">
      {toastMsg && <Toast message={toastMsg} type="success" onClose={() => setToastMsg(null)} />}

      <PageHeader
        title="Thời khóa biểu cá nhân"
        subtitle="Lịch học các môn theo tuần và thời gian chi tiết"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setShowSyncModal(true)}>
              <Calendar className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
              <span>Đồng bộ Google</span>
            </Button>
            <Button variant="secondary" size="sm" onClick={exportToIcs}>
              <Download className="w-3.5 h-3.5" />
              <span>Tải file .ICS</span>
            </Button>
          </>
        }
      />

      <TimetableGrid schedules={schedules} title="Lịch học theo tuần" />

      {/* Google Calendar Sync Modal */}
      <Modal
        open={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        title="Đồng bộ Google Calendar"
        maxWidth="max-w-lg"
      >
        {schedules.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">Chưa có lịch học để đồng bộ.</div>
        ) : (
          <div className="space-y-4">
            {/* Soft, clean sync banner */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Tự động mở Google Calendar với thông tin môn học, thời gian và địa điểm. Bạn chỉ cần bấm <strong>"Lưu"</strong> trực tiếp.
              </p>
              <button 
                onClick={handleDirectSyncAllGoogleCalendar} 
                className="w-full py-2.5 px-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-medium text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-xs"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Đồng bộ Google Calendar</span>
              </button>
            </div>

            {/* Subtle Course List */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Thêm từng môn học:
              </h4>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {schedules.map((s, idx) => {
                  const dayName = DAY_NAMES[s.dayOfWeek || 1];
                  const googleUrl = buildGoogleCalendarUrl(s);
                  return (
                    <div
                      key={s.id || idx}
                      className="p-3 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-white truncate">
                          {s.courseTitle || s.className || s.classCode}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                          <span className="font-medium text-slate-700 dark:text-slate-300">{dayName}</span>
                          <span>Tiết {s.startPeriod}-{s.endPeriod}</span>
                          {s.room && <span>Phòng {s.room}</span>}
                        </div>
                      </div>

                      <a
                        href={googleUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] shrink-0 flex items-center gap-1 transition"
                      >
                        <span>Thêm</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subtle ICS download footer */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
              <span>Outlook / Apple Calendar?</span>
              <button
                onClick={exportToIcs}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" /> Tải file .ICS
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
