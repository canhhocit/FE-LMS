import React, { useState } from 'react';
import type { Schedule } from '../types';

interface TimetableGridProps {
  schedules: Schedule[];
  title?: string;
  onSelectSchedule?: (schedule: Schedule) => void;
  onDeleteSchedule?: (scheduleId: number) => void;
  isEditable?: boolean;
}

const CalendarIcon = ({ className = 'h-5 w-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const ClockIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const LocationIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const UserIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const RefreshIcon = ({ className = 'h-3.5 w-3.5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6" />
    <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
  </svg>
);

const ChevronLeftIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const ChevronRightIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

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

const getScheduleTimeInfo = (item: Schedule) => {
  const sP = item.startPeriod || 1;
  const eP = item.endPeriod || (item.startPeriod ? item.startPeriod + 2 : 3);

  const calcStart = PERIOD_TIMES[sP]?.start || '06:45';
  const calcEnd = PERIOD_TIMES[eP]?.end || '09:25';

  let startTime = (item.startTime && item.startTime !== '00:00' && item.startTime !== '00:00:00')
    ? item.startTime
    : calcStart;
  let endTime = (item.endTime && item.endTime !== '00:00' && item.endTime !== '00:00:00')
    ? item.endTime
    : calcEnd;

  // Fix invalid end times like 04:00 or 02:00 (where endTime <= startTime)
  const [h1, m1] = startTime.split(':').map(Number);
  const [h2, m2] = endTime.split(':').map(Number);
  if ((h2 * 60 + m2) <= (h1 * 60 + m1)) {
    startTime = calcStart;
    endTime = calcEnd;
  }

  return { startTime, endTime, periodLabel: `Tiết ${sP}-${eP}` };
};

const DEFAULT_DEMO_SCHEDULES: Schedule[] = [
  {
    id: 101,
    clazzId: 1,
    dayOfWeek: 1, // Thứ 2
    classCode: 'ENG201-01-2026A',
    className: 'Tiếng Anh chuyên ngành - Nhóm 01',
    courseTitle: 'Tiếng Anh chuyên ngành',
    lecturerName: 'Phạm Thị Bích Ngọc',
    room: 'Trực tuyến',
    startPeriod: 1,
    endPeriod: 6,
    startTime: '06:45',
    endTime: '12:10',
  },
  {
    id: 102,
    clazzId: 2,
    dayOfWeek: 2, // Thứ 3
    classCode: 'IT101-01-2026A',
    className: 'Nhập môn lập trình - Nhóm 01',
    courseTitle: 'Nhập môn lập trình',
    lecturerName: 'Nguyễn Văn An',
    room: 'A301',
    startPeriod: 1,
    endPeriod: 3,
    startTime: '06:45',
    endTime: '09:25',
  },
  {
    id: 103,
    clazzId: 3,
    dayOfWeek: 3, // Thứ 4
    classCode: 'IT202-01-2026A',
    className: 'Cơ sở dữ liệu - Nhóm 01',
    courseTitle: 'Cơ sở dữ liệu',
    lecturerName: 'Trần Thị Bình',
    room: 'B204',
    startPeriod: 1,
    endPeriod: 3,
    startTime: '06:45',
    endTime: '09:25',
  },
  {
    id: 104,
    clazzId: 4,
    dayOfWeek: 4, // Thứ 5
    classCode: 'IT101-TH-2026A',
    className: 'Nhập môn lập trình - Nhóm 01 (Lý thuyết)',
    courseTitle: 'Nhập môn lập trình',
    lecturerName: 'Nguyễn Văn An',
    room: 'LAB-02',
    startPeriod: 4,
    endPeriod: 6,
    startTime: '09:30',
    endTime: '12:10',
  },
  {
    id: 105,
    clazzId: 5,
    dayOfWeek: 6, // Thứ 7
    classCode: 'BUS101-01-2026A',
    className: 'Nguyên lý Marketing - Nhóm 01',
    courseTitle: 'Nguyên lý Marketing',
    lecturerName: 'Lê Minh Cường',
    room: 'C105',
    startPeriod: 1,
    endPeriod: 2,
    startTime: '06:45',
    endTime: '08:25',
  },
  {
    id: 106,
    clazzId: 6,
    dayOfWeek: 7, // Chủ nhật
    classCode: 'GEN101-01-2026A',
    className: 'Kỹ năng học tập - Nhóm 01',
    courseTitle: 'Kỹ năng học tập',
    lecturerName: 'Phạm Hồng Thái',
    room: 'Trực tuyến',
    startPeriod: 1,
    endPeriod: 2,
    startTime: '06:45',
    endTime: '08:25',
  },
];

const CARD_STYLES = [
  { headerBg: 'bg-[#ca8a04]', border: 'border-[#ca8a04]' },
  { headerBg: 'bg-[#00376f]', border: 'border-[#00376f]' },
  { headerBg: 'bg-[#1d4ed8]', border: 'border-[#1d4ed8]' },
  { headerBg: 'bg-[#ea580c]', border: 'border-[#ea580c]' },
  { headerBg: 'bg-[#059669]', border: 'border-[#059669]' },
];

const HOURS = [6, 7, 8, 9, 10, 11, 12];
const HOUR_HEIGHT = 76;

export default function TimetableGrid({
  schedules,
  title = 'Lịch cá nhân',
  onSelectSchedule,
  onDeleteSchedule,
  isEditable = false,
}: TimetableGridProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 16));

  const rawSchedules = schedules.length > 0 ? schedules : DEFAULT_DEMO_SCHEDULES;

  const displaySchedules = rawSchedules.map((s) => {
    const timeInfo = getScheduleTimeInfo(s);
    return { ...s, ...timeInfo };
  });

  const cleanTitle = (title || 'Lịch cá nhân').replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

  const resetToToday = () => {
    setCurrentDate(new Date(2026, 8, 16));
  };

  const getWeekDates = (date: Date) => {
    const day = date.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      week.push(d);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getMonthDays = (y: number, m: number) => {
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const daysInPrevMonth = new Date(y, m, 0).getDate();

    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const days = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      days.push({ dayNum: daysInPrevMonth - i, isCurrentMonth: false, date: new Date(y, m - 1, daysInPrevMonth - i) });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ dayNum: i, isCurrentMonth: true, date: new Date(y, m, i) });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({ dayNum: i, isCurrentMonth: false, date: new Date(y, m + 1, i) });
    }

    return days;
  };

  const calendarDays = getMonthDays(year, month);

  const parseTimeToOffset = (timeStr?: string, defaultHour = 6) => {
    if (!timeStr) return defaultHour - 6;
    const [h, m] = timeStr.split(':').map(Number);
    return Math.max(0, (h || defaultHour) - 6 + (m || 0) / 60);
  };

  const calculateDuration = (startTime?: string, endTime?: string) => {
    if (!startTime || !endTime) return 2.6;
    const [h1, m1] = startTime.split(':').map(Number);
    const [h2, m2] = endTime.split(':').map(Number);
    const diff = (h2 * 60 + m2 - (h1 * 60 + m1)) / 60;
    return diff > 0 ? Math.max(2.2, diff) : 2.6;
  };

  const selectedDayOfWeekIndex = (currentDate.getDay() === 0 ? 7 : currentDate.getDay());
  const selectedDaySchedules = displaySchedules.filter((s) => Number(s.dayOfWeek) === selectedDayOfWeekIndex);
  const selectedDayName = selectedDayOfWeekIndex === 7 ? 'Chủ nhật' : `Thứ ${selectedDayOfWeekIndex + 1}`;

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start text-slate-800">
      {/* Main Timetable Section */}
      <div className="flex-1 w-full min-w-0 bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
        {/* Title Header with SVG Icon & Today Reset Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-[#00376f]" />
            <h2 className="text-base font-bold text-[#00376f]">{cleanTitle}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={resetToToday}
              className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-[#00376f] transition hover:bg-blue-100 active:scale-95 shadow-xs"
              title="Trở về lịch ngày hôm nay"
            >
              <RefreshIcon className="h-3.5 w-3.5 text-[#00376f]" />
              <span>Hôm nay</span>
            </button>
            <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600">
              Tuần: {weekDates[0].getDate()}/{weekDates[0].getMonth() + 1} - {weekDates[6].getDate()}/{weekDates[6].getMonth() + 1}/{year}
            </div>
          </div>
        </div>

        {/* Scrollable Grid Container - Sticky Left Time Column */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 relative">
          <div className="min-w-[1120px]">
            {/* Header Days Row */}
            <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b-2 border-[#00376f] text-center font-medium text-xs">
              {/* Sticky Top-Left Corner Cell */}
              <div className="sticky left-0 z-30 bg-white py-3 text-slate-700 flex items-center justify-center gap-1 font-bold border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
                <span>Giờ VN</span>
              </div>

              {weekDates.map((d, idx) => {
                const dayNum = d.getDate();
                const isSelectedDay = d.toDateString() === currentDate.toDateString();
                const dayLabel = idx === 6 ? 'Chủ nhật' : `Thứ ${idx + 2}`;

                return (
                  <div
                    key={idx}
                    onClick={() => setCurrentDate(d)}
                    className={`py-2.5 px-2 cursor-pointer transition border-r border-slate-200 ${
                      isSelectedDay
                        ? 'bg-[#e8f0fe] text-[#00376f] font-bold rounded-t-lg border-b-2 border-[#00376f]'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-sm font-bold">{dayNum}</div>
                    <div className="text-xs text-slate-500 font-medium">{dayLabel}</div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="relative grid grid-cols-[70px_repeat(7,1fr)]">
              {/* STICKY Left Time Column pinned to left on scroll */}
              <div className="sticky left-0 z-20 bg-white border-r border-slate-200 text-xs font-bold text-slate-700 font-sans shadow-[3px_0_6px_-2px_rgba(0,0,0,0.08)]">
                {HOURS.map((h) => (
                  <div key={h} style={{ height: `${HOUR_HEIGHT}px` }} className="flex items-start justify-center pt-2 border-b border-slate-200 bg-white">
                    {`${h}:00`}
                  </div>
                ))}
              </div>

              {/* 7 Columns for Days */}
              {Array.from({ length: 7 }).map((_, dayIdx) => {
                const dayOfWeekNum = dayIdx + 1;
                const dayItems = displaySchedules.filter((s) => Number(s.dayOfWeek) === dayOfWeekNum);

                return (
                  <div key={dayIdx} className="relative border-r border-slate-200" style={{ minHeight: `${HOURS.length * HOUR_HEIGHT}px` }}>
                    {/* Horizontal hour lines */}
                    {HOURS.map((h) => (
                      <div key={h} style={{ height: `${HOUR_HEIGHT}px` }} className="border-b border-slate-200/80" />
                    ))}

                    {/* Schedule Cards with generous min-height (175px) so bottom text NEVER clips */}
                    {dayItems.map((item, itemIdx) => {
                      const style = CARD_STYLES[(item.clazzId || item.id || itemIdx) % CARD_STYLES.length];
                      const topOffset = parseTimeToOffset(item.startTime, 6) * HOUR_HEIGHT;
                      const durationHours = calculateDuration(item.startTime, item.endTime);
                      const cardHeight = Math.max(175, durationHours * HOUR_HEIGHT);

                      return (
                        <div
                          key={item.id || itemIdx}
                          style={{ top: `${topOffset}px`, height: `${cardHeight}px` }}
                          onClick={() => onSelectSchedule?.(item)}
                          className={`absolute left-1 right-1 z-10 flex flex-col justify-between bg-white border-2 ${style.border} rounded-lg shadow-sm transition hover:shadow-md hover:z-20 cursor-pointer`}
                        >
                          {/* Colored Header Bar */}
                          <div className={`px-2.5 py-1.5 text-white font-bold flex flex-col justify-center ${style.headerBg}`}>
                            <div className="text-xs leading-snug break-words font-extrabold">{item.className || item.courseTitle}</div>
                            <div className="text-[10px] font-normal opacity-95 flex items-center justify-between mt-1 pt-1 border-t border-white/25">
                              <span>{item.startTime} - {item.endTime}</span>
                              <span className="bg-white/20 px-1.5 py-0.2 rounded text-[10px] font-semibold">{item.periodLabel}</span>
                            </div>
                          </div>

                          {/* Card Content - Spacious layout with no bottom clipping */}
                          <div className="p-2 flex-1 flex flex-col justify-between text-center text-xs space-y-1">
                            <div>
                              <div className="font-bold text-slate-800 text-xs leading-tight break-words pt-0.5">
                                {item.classCode || item.clazzCode}
                              </div>
                            </div>

                            <div className="space-y-1 text-xs text-slate-700 font-medium pt-1 border-t border-slate-100 pb-0.5">
                              <div className="text-slate-800 font-bold flex items-center justify-center gap-1 text-xs">
                                <LocationIcon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                                <span className="truncate">{item.room || 'Trực tuyến'}</span>
                              </div>
                              {item.lecturerName && (
                                <div className="text-slate-600 flex items-center justify-center gap-1 text-xs font-semibold">
                                  <UserIcon className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                  <span className="truncate">{item.lecturerName}</span>
                                </div>
                              )}
                            </div>

                            {isEditable && onDeleteSchedule && (
                              <div className="pt-0.5 flex justify-end">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteSchedule(item.id);
                                  }}
                                  className="text-[10px] text-rose-600 font-bold hover:underline"
                                >
                                  Xoá
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Horizontal Scroll Hint Banner */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2 font-medium text-slate-600">
            <span className="inline-block animate-pulse text-blue-600 font-bold">👉</span>
            <span>Di chuyển (cuộn ngang) để xem đầy đủ lịch các ngày trong tuần</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Khung giờ: 06:45 - 17:55
          </div>
        </div>
      </div>

      {/* Right Soft Blue Sidebar Panel */}
      <div className="w-full lg:w-80 shrink-0 space-y-4">
        {/* Soft Blue Mini Calendar Container */}
        <div className="bg-[#dbe5f9] rounded-xl p-4 shadow-sm">
          {/* Header Month Nav */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-sm font-bold text-[#00376f]">
              Tháng {month + 1}-{year}
            </span>
            <div className="flex items-center gap-1 text-[#00376f]">
              <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-white/50 transition">
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-white/50 transition">
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Days Header */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-600 mb-2">
            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>Cn</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((cd, idx) => {
              const isSelected = cd.date.toDateString() === currentDate.toDateString();

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentDate(cd.date)}
                  className={`h-7 w-7 mx-auto flex items-center justify-center rounded-full transition font-medium ${
                    isSelected
                      ? 'bg-[#ea580c] text-white font-bold shadow-md'
                      : cd.isCurrentMonth
                      ? 'text-slate-800 hover:bg-white/60'
                      : 'text-slate-400'
                  }`}
                >
                  {cd.dayNum}
                </button>
              );
            })}
          </div>

          {/* Reset to Today Button inside Calendar Panel */}
          <div className="mt-3 border-t border-blue-200/60 pt-2.5 flex justify-center">
            <button
              type="button"
              onClick={resetToToday}
              className="text-xs font-bold text-[#00376f] hover:underline flex items-center gap-1.5"
            >
              <RefreshIcon className="h-3.5 w-3.5 text-[#00376f]" />
              <span>Về ngày hôm nay</span>
            </button>
          </div>
        </div>

        {/* Today's Schedule Agenda Panel */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-[#00376f] text-sm">
              <CalendarIcon className="h-4 w-4 text-[#00376f]" />
              <span>Lịch học {selectedDayName} ({currentDate.getDate()}/{month + 1})</span>
            </div>
            <span className="text-xs bg-blue-50 text-[#00376f] font-semibold px-2 py-0.5 rounded-full">
              {selectedDaySchedules.length} môn
            </span>
          </div>

          {selectedDaySchedules.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              Không có lịch học vào {selectedDayName}
            </div>
          ) : (
            <div className="space-y-2.5">
              {selectedDaySchedules.map((item, idx) => {
                const style = CARD_STYLES[(item.clazzId || item.id || idx) % CARD_STYLES.length];

                return (
                  <div key={item.id || idx} className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/80 hover:bg-blue-50/50 transition text-xs space-y-1.5 shadow-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-[#00376f] text-xs leading-snug">
                        {item.className || item.courseTitle}
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white shrink-0 ${style.headerBg}`}>
                        {item.periodLabel}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 flex items-center justify-between">
                      <span className="font-mono text-slate-700 font-semibold flex items-center gap-1">
                        <ClockIcon className="h-3 w-3 text-slate-500" />
                        <span>{item.startTime} - {item.endTime}</span>
                      </span>
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        <LocationIcon className="h-3 w-3 text-slate-500" />
                        <span>{item.room || 'Trực tuyến'}</span>
                      </span>
                    </div>

                    <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-1 flex items-center justify-between">
                      <span className="font-mono">{item.classCode || item.clazzCode}</span>
                      <span className="flex items-center gap-1">
                        <UserIcon className="h-3 w-3 text-slate-400" />
                        <span>{item.lecturerName || 'Giảng viên'}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
