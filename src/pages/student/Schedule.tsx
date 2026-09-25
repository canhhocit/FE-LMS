import { useEffect, useState } from 'react';
import { Download, Calendar, ExternalLink, X, Clock, MapPin, CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import * as scheduleService from '../../services/scheduleService';
import { PageTitle, Spinner, ErrorBox } from '../../components/Layout';
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

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}&ctz=Asia/Ho_Chi_Minh`;
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
    setToastMsg('Đã tải file .ICS toàn bộ lịch! Bạn có thể mở trực tiếp hoặc nhập vào Google Calendar/Outlook/iPhone.');
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleSyncAllGoogleCalendar = () => {
    exportToIcs();
    window.open('https://calendar.google.com/calendar/r/settings/export', '_blank');
    setToastMsg('Đã tải file .ICS và mở trang Nhập Lịch Google Calendar. Vui lòng chọn file vừa tải để nhập toàn bộ lịch!');
    setTimeout(() => setToastMsg(null), 6000);
  };

  if (loading) return <Spinner />;
  if (err) return <ErrorBox msg={err} />;

  return (
    <div className="space-y-4">
      {toastMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageTitle>Thời khóa biểu cá nhân</PageTitle>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-xs cursor-pointer active:scale-95"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
            </svg>
            <span>Đồng bộ Google Calendar</span>
          </button>
          <button
            type="button"
            onClick={exportToIcs}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer active:scale-95"
          >
            <Download className="h-4 w-4 text-slate-500 shrink-0" />
            <span>Tải file .ICS</span>
          </button>
        </div>
      </div>

      <TimetableGrid schedules={schedules} title="Lịch cá nhân" />

      {/* Google Calendar Sync Modal */}
      {showSyncModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Đồng bộ lịch học Google Calendar</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Đồng bộ nhanh toàn bộ thời khóa biểu hoặc thêm từng môn học</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSyncModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {schedules.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">Chưa có lịch học để đồng bộ.</div>
            ) : (
              <div className="space-y-4">
                {/* Primary Action Card: Sync All */}
                <div className="p-4 rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 dark:border-blue-800/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-blue-900 dark:text-blue-100">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span>Đồng bộ tất cả lịch học (Khuyên dùng)</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                        Tự động xuất file lịch <strong className="font-semibold text-slate-800 dark:text-slate-200">.ICS</strong> toàn bộ môn học và chuyển đến trang Nhập lịch của Google Calendar.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSyncAllGoogleCalendar}
                    className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition cursor-pointer active:scale-[0.98]"
                  >
                    <Download className="w-4 h-4" />
                    <span>Đồng bộ tất cả vào Google Calendar (.ICS)</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>

                {/* Secondary Option: Manual Single Subject Links */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Hoặc thêm thủ công từng môn học:
                  </h4>

                  <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                    {schedules.map((s, idx) => {
                      const dayName = DAY_NAMES[s.dayOfWeek || 1];
                      const googleUrl = buildGoogleCalendarUrl(s);
                      return (
                        <div
                          key={s.id || idx}
                          className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:border-blue-300 transition"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {s.courseTitle || s.className || s.classCode}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              <span className="bg-blue-100/70 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 px-2 py-0.5 rounded font-bold text-[10px]">
                                {dayName}
                              </span>
                              <span className="flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" /> Tiết {s.startPeriod}-{s.endPeriod}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" /> {s.room ? `Phòng ${s.room}` : 'Trực tuyến'}
                              </span>
                            </div>
                          </div>

                          <a
                            href={googleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 shrink-0 transition cursor-pointer active:scale-95"
                          >
                            <span>Thêm vào Google</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer buttons */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={exportToIcs}
                    className="text-xs font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Chỉ tải file .ICS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSyncModal(false)}
                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200 transition"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
