import { useEffect, useState } from 'react';
import { Download, Calendar, ExternalLink, CalendarPlus, CheckCircle2 } from 'lucide-react';
import * as scheduleService from '../../services/scheduleService';
import * as registrationService from '../../services/registrationService';
import { PageHeader, Spinner, ErrorBox, Button, Modal, Toast } from '../../components/ui';
import TimetableGrid from '../../components/TimetableGrid';
import type { Schedule, AiScheduleRecommendResponse, AiScheduleOption } from '../../types';

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

  // AI Schedule Modal State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AiScheduleRecommendResponse | null>(null);
  const [avoidMorning, setAvoidMorning] = useState(false);
  const [preferSatSun, setPreferSatSun] = useState(true);
  const [customPref, setCustomPref] = useState('');
  const [applyingOptionId, setApplyingOptionId] = useState<string | null>(null);

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

  const handleRunAiRecommend = async () => {
    setAiLoading(true);
    try {
      const preferOffDays: number[] = [];
      if (preferSatSun) {
        preferOffDays.push(6, 7);
      }
      const res = await scheduleService.getAiScheduleRecommendation({
        avoidEarlyMorning: avoidMorning,
        preferOffDays,
        customPreference: customPref.trim() || undefined,
      });
      setAiResponse(res);
    } catch (e: unknown) {
      setToastMsg((e as { message?: string })?.message ?? 'Gợi ý AI thất bại');
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAiOption = async (option: AiScheduleOption) => {
    if (!option.suggestedClasses || option.suggestedClasses.length === 0) return;
    if (!window.confirm(`Xác nhận đăng ký ${option.suggestedClasses.length} lớp học phần theo phương án "${option.title}"?`)) return;

    setApplyingOptionId(option.optionId);
    let successCount = 0;
    const errors: string[] = [];
    try {
      for (const c of option.suggestedClasses) {
        try {
          await registrationService.registerClass(c.id);
          successCount++;
        } catch (err: any) {
          errors.push(`${c.className}: ${err.message || 'Lỗi đăng ký'}`);
        }
      }
      const updatedSchedules = await scheduleService.getMySchedule();
      setSchedules(updatedSchedules);
      if (errors.length > 0) {
        setToastMsg(`Đăng ký thành công ${successCount}/${option.suggestedClasses.length} lớp. Lỗi: ${errors.join('; ')}`);
      } else {
        setToastMsg(`Đã đăng ký thành công ${successCount}/${option.suggestedClasses.length} lớp học phần vào Thời khóa biểu!`);
        setShowAiModal(false);
      }
    } catch (e: unknown) {
      setToastMsg((e as { message?: string })?.message ?? 'Đăng ký thời khóa biểu gợi ý thất bại');
    } finally {
      setApplyingOptionId(null);
    }
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setShowAiModal(true);
                if (!aiResponse) void handleRunAiRecommend();
              }}
            >
              <CalendarPlus className="w-4 h-4" />
              <span>Gợi Ý Xếp Lịch</span>
            </Button>
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

      {/* Schedule Recommendation Modal */}
      <Modal
        open={showAiModal}
        onClose={() => setShowAiModal(false)}
        title="Gợi Ý Xếp Lịch Học"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5">
          {/* Options & Filters */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <CalendarPlus className="w-4 h-4 text-slate-500" />
                Cấu hình nguyện vọng thời khóa biểu
              </span>
              <Button variant="secondary" size="sm" onClick={() => void handleRunAiRecommend()} loading={aiLoading}>
                <span>Cập nhật</span>
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferSatSun}
                  onChange={(e) => setPreferSatSun(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ưu tiên nghỉ Thứ 7 & Chủ Nhật</span>
              </label>

              <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={avoidMorning}
                  onChange={(e) => setAvoidMorning(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Tránh tiết 1-2 (sáng sớm)</span>
              </label>
            </div>

            <div>
              <input
                type="text"
                value={customPref}
                onChange={(e) => setCustomPref(e.target.value)}
                placeholder="Ví dụ: Muốn học gọn vào 3 ngày giữa tuần để đi làm thêm..."
                className="w-full px-3 py-2 text-xs rounded-lg border border-indigo-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Response Output */}
          {aiLoading ? (
            <div className="py-12 text-center space-y-3">
              <Spinner />
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Đang tính toán phương án xếp lịch tối ưu nhất...
              </p>
            </div>
          ) : aiResponse ? (
            <div className="space-y-4">
              {/* Summary Advice */}
              <div className="p-3.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-900 dark:text-indigo-100 border border-indigo-100 dark:border-indigo-800 text-xs leading-relaxed space-y-1 shadow-sm">
                <div className="flex items-center gap-1.5 font-bold">
                  Nhận xét & Khuyến nghị:
                </div>
                <p>{aiResponse.summaryAdvice}</p>
              </div>

              {/* Options List */}
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {aiResponse.options.map((opt) => (
                  <div
                    key={opt.optionId}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <span>{opt.title}</span>
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900">
                            {Math.round(opt.matchScore)}% phù hợp
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {opt.reasoning}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        loading={applyingOptionId === opt.optionId}
                        onClick={() => void handleApplyAiOption(opt)}
                        className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Áp dụng</span>
                      </Button>
                    </div>

                    {/* Classes list inside option */}
                    <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      {opt.suggestedClasses?.map((c) => (
                        <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs space-y-0.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">{c.className}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Mã: <span className="font-mono">{c.classCode}</span> • GV: {c.lecturerName || 'Chưa xếp'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Nhấn <strong>"Cập nhật"</strong> để tạo các phương án xếp lịch.
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
